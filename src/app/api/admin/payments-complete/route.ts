import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin payments API called');
    const supabase = getSupabaseServer();
    
    // Try to fetch from new user_payments table first
    let payments: any[] = [];
    let error: any = null;

    // First check if user_payments table exists by trying a simple query
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('user_payments')
      .select('id')
      .limit(1);

    console.log('📊 user_payments table check:', { 
      hasData: !!tableCheck, 
      dataLength: tableCheck?.length || 0,
      error: tableCheckError?.message || 'none'
    });

    if (tableCheckError || !tableCheck || tableCheck.length === 0) {
      console.log('❌ user_payments table not available or empty:', tableCheckError?.message || 'No data');
      console.log('🔄 Falling back to old payments table...');
      
      // Fallback to old payments table
      const { data: oldPayments, error: oldError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Old payments table check:', {
        hasData: !!oldPayments,
        dataLength: oldPayments?.length || 0,
        error: oldError?.message || 'none',
        sampleData: oldPayments?.[0] || 'none'
      });

      if (oldError) {
        console.error('❌ Error fetching from old payments table:', oldError);
        return NextResponse.json({ error: 'Failed to fetch payments from both tables' }, { status: 500 });
      }
      
      console.log('✅ Successfully fetched from old payments table:', oldPayments?.length || 0, 'payments');

      // Convert old payment format to new format
      payments = (oldPayments || []).map(payment => ({
        ...payment,
        plan_id: null, // Old table doesn't have plan_id
        amount: payment.amount_cents ? payment.amount_cents / 100 : 0, // Convert cents to dollars
        subscription_plans: {
          id: null,
          name: payment.plan || 'Unknown',
          monthly_price: 0,
          yearly_price: 0,
          features: []
        },
        // Add AI analysis fields (they might not exist in old table, so set defaults)
        ai_analysis: payment.ai_analysis || null,
        ai_confidence: payment.ai_confidence || null,
        ai_status: payment.ai_status || null,
        fraud_score: payment.fraud_score || null,
        auto_approved: payment.auto_approved || false,
        needs_review: payment.needs_review || false,
        low_confidence: payment.low_confidence || false,
        image_hash: payment.image_hash || null
      }));

      console.log('Successfully converted old payments:', payments.length, 'payments');
    } else {
      // user_payments table exists, try to fetch with join
      try {
        const { data: newPayments, error: newError } = await supabase
          .from('user_payments')
          .select(`
            *,
            subscription_plans!inner(
              id,
              name,
              monthly_price,
              yearly_price,
              features
            )
          `)
          .order('created_at', { ascending: false });

        if (newError) {
          console.log('❌ New user_payments table error:', newError);
          console.log('🔄 Falling back to old payments table...');
          throw newError;
        }

        payments = newPayments || [];
        console.log('✅ Successfully fetched from user_payments table:', payments.length, 'payments');
        if (payments.length > 0) {
          console.log('📄 Sample payment:', payments[0]);
        }
      } catch (newTableError) {
        console.log('🔄 Falling back to old payments table due to:', newTableError instanceof Error ? newTableError.message : 'Unknown error');
        
        // Fallback to old payments table
        const { data: oldPayments, error: oldError } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (oldError) {
          console.error('❌ Error fetching from old payments table:', oldError);
          return NextResponse.json({ error: 'Failed to fetch payments from both tables' }, { status: 500 });
        }
        
        console.log('✅ Successfully fetched from old payments table:', oldPayments?.length || 0, 'payments');

        // Convert old payment format to new format
        payments = (oldPayments || []).map(payment => ({
          ...payment,
          plan_id: null, // Old table doesn't have plan_id
          amount: payment.amount_cents ? payment.amount_cents / 100 : 0, // Convert cents to dollars
          subscription_plans: {
            id: null,
            name: payment.plan || 'Unknown',
            monthly_price: 0,
            yearly_price: 0,
            features: []
          }
        }));

        console.log('Successfully converted old payments:', payments.length, 'payments');
      }
    }

    // Get user details for each payment
    const paymentsWithUsers = await Promise.all(
      (payments || []).map(async (payment) => {
        try {
          // Get user details from auth.users
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(payment.user_id);
          
          if (userError || !userData.user) {
            console.warn(`Could not fetch user details for ${payment.user_id}:`, userError);
            return {
              ...payment,
              user_email: `User ${payment.user_id.slice(0, 8)}`,
              user_name: 'Unknown',
              plan_name: payment.subscription_plans.name
            };
          }

          return {
            ...payment,
            user_email: userData.user.email || 'Unknown',
            user_name: userData.user.user_metadata?.full_name || 'Unknown',
            plan_name: payment.subscription_plans.name
          };
        } catch (error) {
          console.warn(`Error fetching user details for ${payment.user_id}:`, error);
          return {
            ...payment,
            user_email: `User ${payment.user_id.slice(0, 8)}`,
            user_name: 'Unknown',
            plan_name: payment.subscription_plans.name
          };
        }
      })
    );

        console.log('📊 Final result - Returning payments to admin panel:', paymentsWithUsers.length, 'payments');
        console.log('📋 Payment details:', paymentsWithUsers.map(p => ({
          id: p.id,
          user_email: p.user_email,
          plan_name: p.plan_name,
          status: p.status,
          amount: p.amount
        })));
        
        console.log('📊 Final response:', {
          totalPayments: paymentsWithUsers.length,
          source: payments.length > 0 ? (payments[0].amount_cents ? 'old_payments_table' : 'user_payments_table') : 'no_data',
          samplePayment: paymentsWithUsers[0] || 'none'
        });

        return NextResponse.json({ 
          status: 200,
          data: paymentsWithUsers,
          total: paymentsWithUsers.length,
          source: payments.length > 0 ? (payments[0].amount_cents ? 'old_payments_table' : 'user_payments_table') : 'no_data'
        });
  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        message: 'Check if user_payments or payments table exists and has data',
        suggestion: 'Run debug-admin-payments.sql to diagnose the issue'
      }
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { paymentId, status, adminNote } = await request.json();
    
    if (!paymentId || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: paymentId and status are required' 
      }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "approved" or "rejected"' 
      }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // First, try to get payment from new table, fallback to old table
    let existingPayment: any = null;
    let planName = 'Unknown';
    let planId = null;
    
    try {
      // Try new user_payments table first
      const { data: newPayment, error: newError } = await supabase
        .from('user_payments')
        .select(`
          id, 
          user_id, 
          plan_id, 
          status,
          subscription_plans!inner(
            id,
            name
          )
        `)
        .eq('id', paymentId)
        .single();

      if (newError) {
        throw newError;
      }

      existingPayment = newPayment;
      planName = (newPayment.subscription_plans as any)?.name || 'Unknown';
      planId = newPayment.plan_id;
      console.log('✅ Found payment in new user_payments table');
      
    } catch (newTableError) {
      console.log('🔄 Falling back to old payments table for payment approval');
      
      // Fallback to old payments table
      const { data: oldPayment, error: oldError } = await supabase
        .from('payments')
        .select('id, user_id, plan, status')
        .eq('id', paymentId)
        .single();

      if (oldError) {
        console.error('Error fetching payment from both tables:', oldError);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      existingPayment = oldPayment;
      planName = oldPayment.plan || 'Unknown';
      planId = null; // Old table doesn't have plan_id
      console.log('✅ Found payment in old payments table');
    }
    
    // Update payment status in the appropriate table
    let updateError: any = null;
    
    if (planId !== null) {
      // Update in new user_payments table
      const { error } = await supabase
        .from('user_payments')
        .update({ 
          status, 
          admin_note: adminNote || null,
          reviewed_by: null // TODO: Add admin user ID when implementing proper admin auth
        })
        .eq('id', paymentId);
      
      updateError = error;
    } else {
      // Update in old payments table
      const { error } = await supabase
        .from('payments')
        .update({ 
          status, 
          admin_note: adminNote || null
        })
        .eq('id', paymentId);
      
      updateError = error;
    }

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update payment', 
        details: updateError.message 
      }, { status: 500 });
    }

    // If approved, create new active subscription
    if (status === 'approved') {
      // If we don't have plan_id (from old table), get it from subscription_plans
      if (planId === null) {
        console.log(`Looking up plan_id for plan name: "${planName}"`);
        
        // First try exact match
        let { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('id, name')
          .eq('name', planName)
          .single();

        // If exact match fails, try case-insensitive match
        if (planError) {
          console.log('Exact match failed, trying case-insensitive match');
          const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
            .from('subscription_plans')
            .select('id, name')
            .ilike('name', planName)
            .single();
          
          if (caseInsensitiveError) {
            console.log('Case-insensitive match failed, trying partial match');
            
            // Try partial match with common plan name variations
            const planVariations = [
              planName.toLowerCase(),
              planName.toLowerCase().replace(/\s+/g, ''),
              planName.toLowerCase().replace(/\s+/g, '-'),
              planName.toLowerCase().replace(/\s+/g, '_')
            ];
            
            let foundPlan: any = null;
            for (const variation of planVariations) {
              const { data: variationData, error: variationError } = await supabase
                .from('subscription_plans')
                .select('id, name')
                .ilike('name', `%${variation}%`)
                .single();
              
              if (!variationError && variationData) {
                foundPlan = variationData;
                break;
              }
            }
            
            if (foundPlan) {
              planData = foundPlan;
              planError = null;
            } else {
              // List all available plans for debugging
              const { data: allPlans } = await supabase
                .from('subscription_plans')
                .select('id, name');
              
              console.error('Available plans:', allPlans);
              console.error('Failed to find plan:', planError);
              return NextResponse.json({ 
                error: 'Failed to find plan details', 
                details: `Plan "${planName}" not found. Available plans: ${allPlans?.map(p => p.name).join(', ') || 'None'}`,
                availablePlans: allPlans
              }, { status: 500 });
            }
          } else {
            planData = caseInsensitiveData;
            planError = null;
          }
        }

        if (planError || !planData) {
          console.error('Error finding plan:', planError);
          return NextResponse.json({ 
            error: 'Failed to find plan details', 
            details: String(planError || 'Plan data is null')
          }, { status: 500 });
        }

        planId = planData.id;
        console.log(`✅ Found plan_id ${planId} for plan name "${planName}" (matched: "${planData.name}")`);
      }

      // First, deactivate any existing active subscriptions
      const { error: deactivateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired'
        })
        .eq('user_id', existingPayment.user_id)
        .eq('status', 'active');

      if (deactivateError) {
        console.warn('Error deactivating existing subscriptions:', deactivateError);
      }

      // Create new active subscription with 30-day expiry
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now

      const { error: subCreateError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: existingPayment.user_id,
          plan_id: planId,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          payment_id: paymentId
        });

      if (subCreateError) {
        console.error('Error creating subscription:', subCreateError);
        return NextResponse.json({ 
          error: 'Failed to create subscription', 
          details: subCreateError.message 
        }, { status: 500 });
      }

      console.log(`✅ Subscription activated for user ${existingPayment.user_id} with plan ${planName} (ID: ${planId})`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Payment ${status} successfully`,
      paymentId,
      status 
    });
  } catch (error) {
    console.error('Error in payment update API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
