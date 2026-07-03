import Image from "next/image";
import { Card } from "@/components/ui/card";

interface ResourceCardProps {
  title: string;
  description: string;
  url: string;
  thumbnail: string;
}

export function ResourceCard({
  title,
  description,
  url,
  thumbnail,
}: ResourceCardProps) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="h-full transition-colors hover:border-primary">
        <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-background">
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <h3 className="mb-2 font-medium">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
      </Card>
    </a>
  );
}
