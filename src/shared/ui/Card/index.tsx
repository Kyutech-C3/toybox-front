import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

import Batch from "../Batch";
import EditSquareIcon from "../EditSquareIcon";
import UserButton from "../UserButton";
import VisibilityIcon from "../VisibilityIcon";
import useMarquee from "./hook/useMarquee";
import styles from "./index.module.css";

import { formatDateTime } from "@/util/formatDateTime";

import type { ReactNode, SyntheticEvent } from "react";
import type { Work } from "@/shared/types/work";

type CardProps = {
  work: Work;
  viewerUserID?: string;
  favoriteButton?: ReactNode;
};

const DEFAULT_CARD_IMAGE_URL = "/comingSoonLugia.webp";
const WHEEL_LINE_HEIGHT = 16;
const WHEEL_PAGE_HEIGHT = 100;

const getWheelDelta = (event: WheelEvent) => {
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return event.deltaX;
  if (event.shiftKey) return event.deltaY;
  return 0;
};

const toPixelDelta = (delta: number, deltaMode: number) => {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * WHEEL_LINE_HEIGHT;
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * WHEEL_PAGE_HEIGHT;
  return delta;
};

const getHorizontalWheelDelta = (event: WheelEvent) =>
  toPixelDelta(getWheelDelta(event), event.deltaMode);

const Card = ({ work, viewerUserID, favoriteButton }: CardProps) => {
  const isEditable = viewerUserID === work.user.id;
  const wrapperRef = useRef<HTMLElement>(null);
  const titleMarquee = useMarquee();
  const tagsMarquee = useMarquee();

  const handleMouseEnter = () => {
    titleMarquee.measure();
    tagsMarquee.measure();
  };

  const handleMouseLeave = () => {
    titleMarquee.reset();
    tagsMarquee.reset();
  };

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!image.src.endsWith(DEFAULT_CARD_IMAGE_URL)) {
      image.src = DEFAULT_CARD_IMAGE_URL;
    }
  };

  const scrollTitleBy = titleMarquee.scrollBy;
  const scrollTagsBy = tagsMarquee.scrollBy;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (event: WheelEvent) => {
      const delta = getHorizontalWheelDelta(event);
      if (delta === 0) return;

      const isTitleScrolled = scrollTitleBy(delta);
      const isTagsScrolled = scrollTagsBy(delta);
      if (isTitleScrolled || isTagsScrolled) event.preventDefault();
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [scrollTitleBy, scrollTagsBy]);

  return (
    <article
      className={styles["card-wrapper"]}
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
            ref={titleMarquee.setContainer}
          >
            <Link to={`/works/${work.id}`} className={styles["work-link"]}>
              <span
                className={styles["marquee-content"]}
                data-marquee={titleMarquee.marqueeState}
                style={titleMarquee.marqueeStyle}
                ref={titleMarquee.setContent}
              >
                <span
                  className={styles["marquee-item"]}
                  ref={titleMarquee.setItem}
                >
                  {work.title}
                </span>
                {titleMarquee.isOverflowing && (
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
        <div className={styles["card-tags"]} ref={tagsMarquee.setContainer}>
          <span
            className={styles["marquee-content"]}
            data-marquee={tagsMarquee.marqueeState}
            style={tagsMarquee.marqueeStyle}
            ref={tagsMarquee.setContent}
          >
            <span className={styles["marquee-item"]} ref={tagsMarquee.setItem}>
              {work.tags.map((tag) => (
                <Batch key={`${work.id}-${tag.id}`} color="pale">
                  {tag.name}
                </Batch>
              ))}
            </span>
            {tagsMarquee.isOverflowing && (
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
