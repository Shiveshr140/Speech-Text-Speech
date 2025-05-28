import AudioUploader from "@/components/audio-uploader"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Audio File Upload</h1>
      <div className="max-w-md mx-auto">
        <AudioUploader />
      </div>
    </main>
  )
}
