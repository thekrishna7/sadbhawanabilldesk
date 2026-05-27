import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL || ''
    const directUrl = process.env.DIRECT_URL || ''
    
    // Obfuscate sensitive connection strings
    const obfDbUrl = dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':****@') : 'not defined'
    const obfDirectUrl = directUrl ? directUrl.replace(/:([^:@]+)@/, ':****@') : 'not defined'

    // Try a simple database query
    const userCount = await db.user.count()

    return NextResponse.json({
      status: 'success',
      database_url_configured: !!dbUrl,
      direct_url_configured: !!directUrl,
      obfuscated_db_url: obfDbUrl,
      obfuscated_direct_url: obfDirectUrl,
      user_count: userCount
    })
  } catch (error: any) {
    const dbUrl = process.env.DATABASE_URL || ''
    const obfDbUrl = dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':****@') : 'not defined'

    return NextResponse.json({
      status: 'error',
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      database_url_configured: !!dbUrl,
      obfuscated_db_url: obfDbUrl,
      error_details: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 })
  }
}
