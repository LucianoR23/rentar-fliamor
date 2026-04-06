import { NextResponse } from 'next/server'
import { getICL } from '@/lib/indices'

export async function GET() {
  try {
    const data = await getICL()
    return NextResponse.json(data)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
