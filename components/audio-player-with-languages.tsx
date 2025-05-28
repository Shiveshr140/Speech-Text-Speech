"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { translateAudio } from "@/actions/translate-action"
import { Loader2 } from "lucide-react"

type Language = "english" | "hindi" | "hinglish"

interface AudioPlayerWithLanguagesProps {
  originalAudioUrl: string
  docId: string
}

export default function AudioPlayerWithLanguages({ originalAudioUrl, docId }: AudioPlayerWithLanguagesProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english")
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedAudios, setTranslatedAudios] = useState<Record<Language, string | null>>({
    english: originalAudioUrl,
    hindi: null,
    hinglish: null,
  })

 const handleLanguageChange = async (language: Language) => {
  setSelectedLanguage(language);
  if (translatedAudios[language]) return;

  setIsTranslating(true);
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      body: JSON.stringify({ audioUrl: originalAudioUrl, targetLanguage: language, docId }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await res.json();

    if (result.success && result.url) {
      // const byteCharacters = atob(result.audioBase64);
      // const byteNumbers = new Array(byteCharacters.length);
      // for (let i = 0; i < byteCharacters.length; i++) {
      //   byteNumbers[i] = byteCharacters.charCodeAt(i);
      // }
      // const byteArray = new Uint8Array(byteNumbers);
      // const blob = new Blob([byteArray], { type: "audio/wav" });
      const audioUrl = result.url

      setTranslatedAudios((prev) => ({
        ...prev,
        [language]: audioUrl,
      }));
    } else {
      console.error("Translation failed:", result.error);
    }
  } catch (error) {
    console.error("Translation error:", error);
  } finally {
    setIsTranslating(false);
  }
};


  const languageLabels: Record<Language, string> = {
    english: "English",
    hindi: "Hindi",
    hinglish: "Hinglish",
  }

  return (
    <Card className="w-full mt-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-1">Play in Different Languages</h3>
        <p className="text-red-600 tex-[10px] mb-4">For longer file use streaming</p>
        <Tabs defaultValue="english" onValueChange={(value) => handleLanguageChange(value as Language)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="english">English</TabsTrigger>
            <TabsTrigger value="hindi">Hindi</TabsTrigger>
            <TabsTrigger value="hinglish">Hinglish</TabsTrigger>
          </TabsList>

          {Object.entries(translatedAudios).map(([lang, url]) => (
            <TabsContent key={lang} value={lang} className="py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{languageLabels[lang as Language]}</h4>
                  {lang !== "english" && <div className="text-xs text-gray-500">Translated from original</div>}
                </div>

                {isTranslating && selectedLanguage === lang ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Translating to {languageLabels[lang as Language]}...</span>
                  </div>
                ) : url ? (
                  <audio controls src={url} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <Button onClick={() => handleLanguageChange(lang as Language)} variant="outline" className="w-full">
                    Translate to {languageLabels[lang as Language]}
                  </Button>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
