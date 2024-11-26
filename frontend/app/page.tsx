import { Features } from "@/components/features";
import { DownloadForm } from "@/components/download-form";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <section className="container flex flex-col items-center gap-6 pb-8 pt-6 md:py-10">
        <div className="flex max-w-[980px] flex-col items-center gap-4">
          <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1]">
            Download YouTube Videos & Playlists
            <br className="hidden sm:inline" />
            Quickly & Easily
          </h1>
          <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
            Download YouTube videos or entire playlists in your preferred quality.
            Fast, simple, and reliable.
          </p>
        </div>
        <div className="w-full max-w-xl px-4">
          <DownloadForm />
        </div>
      </section>
      <Features />
    </main>
  );
}