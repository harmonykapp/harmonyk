import { NextResponse } from 'next/server'
import { validateDocumensoConfig } from '@/lib/env'

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSvc  = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  
  let hasDocumenso = false
  let documensoErrors: string[] | undefined = undefined
  
  try {
    const documensoConfig = validateDocumensoConfig()
    hasDocumenso = documensoConfig.valid
    if (documensoConfig.errors.length > 0) {
      documensoErrors = documensoConfig.errors
    }
  } catch (error) {
    // If validation throws (e.g., getDocumensoApiToken throws in production), mark as invalid
    hasDocumenso = false
    documensoErrors = [error instanceof Error ? error.message : 'Unknown error']
  }
  
  return NextResponse.json({ 
    hasUrl, 
    hasAnon, 
    hasSvc, 
    hasOpenAI,
    hasDocumenso,
    documensoErrors
  })
}
