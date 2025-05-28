"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { uploadAudio } from "@/actions/upload-action";
import { Loader2, Upload, CheckCircle, XCircle } from "lucide-react";
import AudioPlayerWithLanguages from "./audio-player-with-languages";

import { put } from "@vercel/blob";
import useUpload from "@/hooks/useUpload";
import AudioPlayerWithStreaming from "./audio-player-with-streaming";
// import { revalidatePath } from "next/cache"

export default function AudioUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { handleUpload, url } = useUpload();
  const [docId, setDocId] = useState<string | null>(null)

  // const url = "https://firebasestorage.googleapis.com/v0/b/speech-text-speech-6b769.firebasestorage.app/o/audios%2F0658cafc-f778-461a-b0ee-847d748291d2?alt=media&token=5c92e03a-fceb-4a73-b9d3-d728873f30a6"
  // const docid = "0658cafc-f778-461a-b0ee-847d748291d2"
  // const url2_hindi_compressd = ""https://firebasestorage.googleapis.com/v0/b/speech-text-speech-6b769.firebasestorage.app/o/audios%2Fb57281dd-f310-40ed-b851-e53174dda942?alt=media&token=dfe7b648-311d-49b0-b225-4c4e0bcb5321"
  // docId = "3de4bc89-22fe-4758-95bf-3ecadc01971c"

  // const url3_english = "https://firebasestorage.googleapis.com/v0/b/speech-text-speech-6b769.firebasestorage.app/o/audios%2F692db01c-2a33-4de7-91c1-c3342499cc1d?alt=media&token=210f72d2-9e7a-4fe4-8048-48a6fd4c20c3"
  // docId = "692db01c-2a33-4de7-91c1-c3342499cc1d"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setUploadedAudio(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setError("Please select a valid audio file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }
    setIsUploading(true); 

    setError(null);
    setSuccess(false);

    try {
      const {downloadUrl:uploadedUrl, fileIdToUploadTo:docId} = await handleUpload(file);
      // setUploadedUrl(uploadedUrl)
      setSuccess(true);
      setUploadedAudio(uploadedUrl);
      setDocId(docId)
    } catch (err) {
      setError("Upload failed, please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Audio</CardTitle>
        <CardDescription>
          Select an audio file to upload. Supported formats: MP3, WAV, OGG, etc.
          Maximum size: 50MB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  id="audio-file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={success}
                />
                <label
                  htmlFor="audio-file"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium">
                    {file ? file.name : "Click to select audio file"}
                  </span>
                  {file && (
                    <span className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                  <XCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-500 text-sm mt-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Audio uploaded successfully!</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Audio"
              )}
            </Button>
          </div>
        </form>

        {uploadedAudio && docId ? (
          <>
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Original Audio:</h3>
              <audio controls src={uploadedAudio} className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="flex flex-col">
              <AudioPlayerWithLanguages originalAudioUrl={uploadedAudio} docId={docId} />
              <AudioPlayerWithStreaming originalAudioUrl={uploadedAudio} docId={docId}/>
            </div>
          </> 
        ): null}
      </CardContent>
    </Card>
  );
}
