-- Satış RPC
CREATE OR REPLACE FUNCTION public.process_sale(
    p_business_id uuid,
    p_user_id uuid,
    p_total_amount numeric,
    p_discount_amount numeric,
    p_final_amount numeric,
    p_payment_method text,
    p_note text,
    p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_sale_id uuid;
    item jsonb;
    v_product_id uuid;
    v_quantity int;
    v_previous_stock int;
    v_new_stock int;
BEGIN
    -- 1. Insert into sales
    INSERT INTO public.sales (
        business_id,
        total_amount,
        discount_amount,
        final_amount,
        payment_method,
        status,
        note,
        created_by
    ) VALUES (
        p_business_id,
        p_total_amount,
        p_discount_amount,
        p_final_amount,
        p_payment_method,
        'completed',
        p_note,
        p_user_id
    ) RETURNING id INTO v_sale_id;

    -- 2. Loop over items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (item->>'product_id')::uuid;
        v_quantity := (item->>'quantity')::int;
        
        -- Lock product row and get current stock
        SELECT stock_quantity INTO v_previous_stock
        FROM public.products
        WHERE id = v_product_id AND business_id = p_business_id
        FOR UPDATE;
        
        IF v_previous_stock IS NULL THEN
            RAISE EXCEPTION 'Product % not found in business %', v_product_id, p_business_id;
        END IF;

        v_new_stock := v_previous_stock - v_quantity;

        -- Create sale item
        INSERT INTO public.sale_items (
            business_id,
            sale_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            cost_price
        ) VALUES (
            p_business_id,
            v_sale_id,
            v_product_id,
            v_quantity,
            (item->>'unit_price')::numeric,
            (item->>'total_price')::numeric,
            (item->>'cost_price')::numeric
        );

        -- Update product stock
        UPDATE public.products
        SET stock_quantity = v_new_stock,
            updated_at = now()
        WHERE id = v_product_id AND business_id = p_business_id;

        -- Create stock movement
        INSERT INTO public.stock_movements (
            business_id,
            product_id,
            movement_type,
            quantity,
            previous_quantity,
            new_quantity,
            note,
            created_by
        ) VALUES (
            p_business_id,
            v_product_id,
            'sale',
            v_quantity,
            v_previous_stock,
            v_new_stock,
            'Satış işlemi #' || CAST(v_sale_id AS text),
            p_user_id
        );
    END LOOP;

    RETURN v_sale_id;
END;
$$;

-- Stok Hareketi RPC
CREATE OR REPLACE FUNCTION public.process_stock_movement(
    p_business_id uuid,
    p_product_id uuid,
    p_movement_type text,
    p_quantity int, 
    p_note text,
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_movement_id uuid;
    v_previous_stock int;
    v_new_stock int;
BEGIN
    SELECT stock_quantity INTO v_previous_stock
    FROM public.products
    WHERE id = p_product_id AND business_id = p_business_id
    FOR UPDATE;

    IF v_previous_stock IS NULL THEN
        RAISE EXCEPTION 'Product % not found in business %', p_product_id, p_business_id;
    END IF;

    IF p_movement_type = 'stock_in' THEN
        v_new_stock := v_previous_stock + p_quantity;
    ELSIF p_movement_type = 'stock_out' THEN
        v_new_stock := v_previous_stock - p_quantity;
    ELSIF p_movement_type = 'adjustment' THEN
        v_new_stock := v_previous_stock + p_quantity;
    ELSE
        RAISE EXCEPTION 'Invalid movement_type %', p_movement_type;
    END IF;

    -- Update product stock
    UPDATE public.products
    SET stock_quantity = v_new_stock,
        updated_at = now()
    WHERE id = p_product_id AND business_id = p_business_id;

    -- Insert movement
    INSERT INTO public.stock_movements (
        business_id,
        product_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        note,
        created_by
    ) VALUES (
        p_business_id,
        p_product_id,
        p_movement_type,
        ABS(p_quantity),
        v_previous_stock,
        v_new_stock,
        p_note,
        p_user_id
    ) RETURNING id INTO v_movement_id;

    RETURN v_movement_id;
END;
$$;
