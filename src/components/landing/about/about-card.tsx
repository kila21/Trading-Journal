import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import {
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
} from "./social-icons";
import { socialLinks } from "@/config/site";

const socialIcons = {
  github: GithubIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
} as const;

export function AboutCard() {
  const t = useTranslations("about");

  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-10 text-center text-3xl font-semibold">
        {t("heading")}
      </h2>
      <Card className="mx-auto flex max-w-xs flex-col items-center gap-4 text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full">
          <Image
            src="/avatar-placeholder.svg"
            alt={t("name")}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
        <p className="font-medium">{t("name")}</p>
        <div className="flex gap-4">
          {socialLinks.map(({ key, href }) => {
            const Icon = socialIcons[key];
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(`social.${key}`)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary text-primary transition-colors hover:bg-primary/10"
              >
                <Icon className="h-6 w-6" />
              </a>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
