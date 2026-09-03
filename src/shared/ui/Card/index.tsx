import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

import Batch from "../Batch";
import EditSquareIcon from "../EditSquareIcon";
import UserButton from "../UserButton";
import VisibilityIcon from "../VisibilityIcon";
import styles from "./index.module.css";

import { formatDateTime } from "@/util/formatDateTime";

import type { CSSProperties, ReactNode, SyntheticEvent } from "react";
import type { Work } from "@/shared/types/work";

type CardProps = {
  work: Work;
  viewerUserID?: string;
  favoriteButton?: ReactNode;
};

const DEFAULT_CARD_IMAGE_URL = "/comingSoonLugia.webp";
const MARQUEE_SPEED = 50;
const MARQUEE_GAP = 40;

type MarqueeStyle = CSSProperties & {
  "--marquee-gap"?: string;
  "--marquee-shift"?: string;
  "--marquee-duration"?: string;
};

const getMarqueeShift = (
  item: HTMLElement | null,
  container: HTMLElement | null,
) => {
  if (!item || !container) return 0;
  if (item.scrollWidth <= container.clientWidth) return 0;
  return item.scrollWidth + MARQUEE_GAP;
};

const toMarqueeStyle = (shift: number): MarqueeStyle =>
  shift > 0
    ? {
        "--marquee-gap": `${MARQUEE_GAP}px`,
        "--marquee-shift": `${-shift}px`,
        "--marquee-duration": `${shift / MARQUEE_SPEED}s`,
      }
    : {};

const Card = ({ work, viewerUserID, favoriteButton }: CardProps) => {
  const isEditable = viewerUserID === work.user.id;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleContentRef = useRef<HTMLSpanElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const tagsContentRef = useRef<HTMLSpanElement>(null);
  const [titleShift, setTitleShift] = useState(0);
  const [tagsShift, setTagsShift] = useState(0);

  const handleMouseEnter = () => {
    setTitleShift(getMarqueeShift(titleContentRef.current, titleRef.current));
    setTagsShift(getMarqueeShift(tagsContentRef.current, tagsRef.current));
  };

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!image.src.endsWith(DEFAULT_CARD_IMAGE_URL)) {
      image.src = DEFAULT_CARD_IMAGE_URL;
    }
  };

  return (
    <article className={styles["card-wrapper"]} onMouseEnter={handleMouseEnter}>
      <div className={styles["card-image-wrapper"]}>
        <img
          src={work.thumbnail_url || DEFAULT_CARD_IMAGE_URL}
          alt={`${work.title}のサムネイル`}
          className={styles["card-image"]}
          onError={handleImageError}
        />
      </div>
      <div className={styles["card-body"]}>
        <div className={styles["card-title-row"]}>
          <h3
            className={styles["card-title"]}
            title={work.title}
            ref={titleRef}
          >
            <Link to={`/works/${work.id}`} className={styles["work-link"]}>
              <span
                className={styles["marquee-content"]}
                data-marquee={titleShift > 0 ? "true" : "false"}
                style={toMarqueeStyle(titleShift)}
              >
                <span className={styles["marquee-item"]} ref={titleContentRef}>
                  {work.title}
                </span>
                {titleShift > 0 && (
                  <span className={styles["marquee-item"]} aria-hidden="true">
                    {work.title}
                  </span>
                )}
              </span>
            </Link>
          </h3>
          <VisibilityIcon
            visibility={work.visibility}
            className={styles["visibility-icon"]}
          />
        </div>
        <div className={styles["card-tags"]} ref={tagsRef}>
          <span
            className={styles["marquee-content"]}
            data-marquee={tagsShift > 0 ? "true" : "false"}
            style={toMarqueeStyle(tagsShift)}
          >
            <span className={styles["marquee-item"]} ref={tagsContentRef}>
              {work.tags.map((tag) => (
                <Batch key={`${work.id}-${tag.id}`} color="pale">
                  {tag.name}
                </Batch>
              ))}
            </span>
            {tagsShift > 0 && (
              <span className={styles["marquee-item"]} aria-hidden="true">
                {work.tags.map((tag) => (
                  <Batch key={`${work.id}-${tag.id}-loop`} color="pale">
                    {tag.name}
                  </Batch>
                ))}
              </span>
            )}
          </span>
        </div>
        <p className={styles["card-date"]}>
          <span className={styles["card-date-icon"]} aria-hidden="true">
            <AccessTimeRoundedIcon fontSize="inherit" />
          </span>
          <time dateTime={work.created_at}>
            {formatDateTime(work.created_at)}
          </time>
        </p>
        <div className={styles["card-footer"]}>
          <UserButton
            userID={work.user.id}
            displayName={work.user.display_name}
            avatarURL={work.user.avatar_url || undefined}
            size="compact"
          />
          <div className={styles["card-actions"]}>
            {isEditable && (
              <Link
                to={`/edit/${work.id}`}
                className={styles["edit-link"]}
                aria-label={`${work.title}を編集する`}
                title="編集する"
              >
                <EditSquareIcon />
              </Link>
            )}
            {favoriteButton}
          </div>
        </div>
      </div>
    </article>
  );
};

export default Card;
