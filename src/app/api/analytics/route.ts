import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();
    
    // Validate the event
    if (!event.event || !event.timestamp) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Log the event (in production, you'd send to your analytics service)
    console.log('Analytics Event:', {
      event: event.event,
      properties: event.properties,
      timestamp: new Date(event.timestamp).toISOString(),
      userId: event.userId,
      sessionId: event.sessionId
    });

    // In production, you would:
    // 1. Send to Google Analytics 4
    // 2. Send to your database
    // 3. Send to third-party analytics services
    // 4. Process for real-time dashboards

    // Example: Send to Google Analytics 4
    if (process.env.GA_MEASUREMENT_ID) {
      try {
        await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: event.sessionId || 'anonymous',
            events: [{
              name: event.event,
              params: {
                ...event.properties,
                page_title: event.properties?.page || 'Unknown',
                page_location: `https://www.neurativo.com${event.properties?.page || ''}`,
                timestamp_micros: event.timestamp * 1000
              }
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send to Google Analytics:', error);
      }
    }

    // Example: Store in database (using your preferred database)
    // await storeAnalyticsEvent(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics event' },
      { status: 500 }
    );
  }
}

// Optional: Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // In production, you would query your database
    // const events = await getAnalyticsEvents({ eventType, startDate, endDate });

    return NextResponse.json({
      message: 'Analytics data retrieval not implemented',
      // events: events
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}
