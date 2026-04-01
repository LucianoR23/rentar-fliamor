import { NextResponse } from 'next/server'
import { getIPC } from '@/lib/indices'

export async function GET() {
  try {
    const data = await getIPC()
    return NextResponse.json(data)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
