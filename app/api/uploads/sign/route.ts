// app/api/uploads/sign/route.ts
import { NextResponse } from 'next/server'
import cloudinary from 'cloudinary'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  // (Optional) parse body to customize folder/contexts; MVP uses fixed folder
  const { folder } = await req.json().catch(() => ({}))

  const timestamp = Math.round(Date.now() / 1000)
  const uploadParams: Record<string, string | number> = {
    timestamp,
    folder:
      folder ||
      process.env.CLOUDINARY_UPLOAD_FOLDER ||
      'my-print-shop/user_uploads',
    // You can add: context, tags, eager, public_id, etc., and they must be included in the signature
  }

  // Cloudinary signs the string_to_sign built from these params
  const signature = cloudinary.v2.utils.api_sign_request(
    uploadParams,
    process.env.CLOUDINARY_API_SECRET as string
  )

  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    folder: uploadParams.folder,
    signature,
  })
}
