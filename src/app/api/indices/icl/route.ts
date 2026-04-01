import { NextRequest, NextResponse } from 'next/server'
import { getICL } from '@/lib/indices'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const date = searchParams.get('date') ?? undefined
    const data = await getICL(date)
    return NextResponse.json(data)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
