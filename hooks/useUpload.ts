import { db, storage } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { ST } from "next/dist/shared/lib/utils";
import React, { useEffect, useState } from "react";
// import { useSelector } from 'react-redux'
import { v4 as uuid4 } from "uuid";

//  custom hook are always client side
// Enum automatically creates a type for its keys and values. When you use an enum type, TypeScript will only allow the defined enum values, reducing the chances of introducing errors due to typos or incorrect values.
// Plain Object will do the same but then why we need enum => Built-in Reverse Mapping (Enum Only)
// const value = StatusText.Uploading ==> "Uploading..."
// const key = StatusText[value] ==> "Uploading"

export enum StatusText {
  UPLOADING = "Uploading file....",
  UPLOADED = "File Uploaded Successfully",
  SAVING = "Saving file to database...",
  GENERATING = "Generating AI Emeddings, This will only taking seconds...",
}

export type Status = StatusText[keyof StatusText];

type ReturnedPromise = {
   downloadUrl: string,
fileIdToUploadTo: string
}

function useUpload() {
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);


  // Return Promise that resolves with the download URL
  const handleUpload = (file: File): Promise<ReturnedPromise> => {
    return new Promise((resolve, reject) => {
      if (!file) reject("No file provided");

      const fileIdToUploadTo = uuid4();
      const storageRef = ref(storage, `audios/${fileIdToUploadTo}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percentage =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setStatus(StatusText.UPLOADING);
          setProgress(percentage);
        },
        (error) => {
          console.error("Upload error", error);
          setStatus("Upload failed");
          reject(error);
        },
        async () => {
          setStatus(StatusText.UPLOADED);
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setStatus(StatusText.SAVING);
          setUrl(downloadUrl);
          const docDetail = await setDoc(doc(db, "audio", fileIdToUploadTo), {
            name: file.name,
            size: file.size,
            type: file.type,
            originalAudioUrl: downloadUrl,
            translatedAudioUrls: {},
            status: "uploaded",
            ref: uploadTask.snapshot.ref.fullPath,
            createdAt: new Date(),
          });
          setStatus(StatusText.GENERATING);
          setFileId(fileIdToUploadTo);
          resolve({downloadUrl, fileIdToUploadTo});
        }
      );
    });
  };

  return { fileId, handleUpload, progress, status, url };
}

export default useUpload;
