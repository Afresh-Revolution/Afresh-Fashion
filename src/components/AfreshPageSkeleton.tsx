import { Skeleton } from "@/components/Skeleton";
import sk from "@/styles/skeleton.module.scss";

function SectionHeader() {
  return (
    <div className={sk.sectionHeaderSkeleton}>
      <div className={sk.headerText}>
        <Skeleton style={{ width: "5rem", height: "0.625rem" }} />
        <Skeleton style={{ width: "clamp(10rem, 30vw, 18rem)", height: "2.5rem" }} />
      </div>
      <Skeleton style={{ width: "5rem", height: "0.75rem" }} />
    </div>
  );
}

export default function AfreshPageSkeleton() {
  return (
    <div className={sk.pageSkeleton} aria-busy="true" aria-label="Loading page content">
      <section className={sk.heroSkeleton}>
        <div className={sk.heroSkeletonInner}>
          <Skeleton style={{ width: "8rem", height: "0.625rem" }} />
          <Skeleton style={{ width: "min(90vw, 28rem)", height: "clamp(3rem, 12vw, 6rem)" }} />
          <Skeleton style={{ width: "min(80vw, 22rem)", height: "1rem" }} />
          <Skeleton style={{ width: "min(70vw, 18rem)", height: "1rem" }} />
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <Skeleton style={{ width: "8rem", height: "2.75rem" }} rounded />
            <Skeleton style={{ width: "7rem", height: "2.75rem" }} rounded />
          </div>
        </div>
      </section>

      <div className={sk.marqueeSkeleton}>
        <Skeleton style={{ width: "100%", height: "100%" }} />
      </div>

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonMatte}`}>
        <div className={sk.sectionInner}>
          <div className={sk.aboutGridSkeleton}>
            <div className={sk.headerText}>
              <Skeleton style={{ width: "4rem", height: "0.625rem" }} />
              <Skeleton style={{ width: "14rem", height: "2.5rem" }} />
              <Skeleton style={{ width: "4rem", height: "2px", marginTop: "0.5rem" }} />
            </div>
            <div className={sk.headerText}>
              <Skeleton style={{ width: "100%", height: "1rem" }} />
              <Skeleton style={{ width: "95%", height: "1rem" }} />
              <Skeleton style={{ width: "88%", height: "1rem" }} />
              <Skeleton style={{ width: "6rem", height: "2rem", marginTop: "1rem" }} />
            </div>
          </div>
          <div className={sk.statsRow}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={sk.headerText}>
                <Skeleton style={{ width: "3rem", height: "2rem" }} />
                <Skeleton style={{ width: "5rem", height: "0.625rem" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonGraphite}`}>
        <div className={sk.sectionInner}>
          <SectionHeader />
          <div className={sk.collectionsGridSkeleton}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className={sk.collectionCardSkeleton} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonMatte}`}>
        <div className={sk.sectionInner}>
          <SectionHeader />
        </div>
        <div className={sk.lookbookTrackSkeleton}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={sk.lookCardSkeleton} />
          ))}
        </div>
      </section>

      <Skeleton className={sk.cinematicSkeleton} />

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonMatte}`}>
        <div className={sk.sectionInner}>
          <SectionHeader />
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ width: "3.5rem", height: "1.5rem" }} rounded="full" />
            ))}
          </div>
          <div className={sk.shopGridSkeleton}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className={sk.productCardSkeleton}>
                <Skeleton className={sk.productImageSkeleton} />
                <Skeleton style={{ width: "80%", height: "0.75rem" }} />
                <Skeleton style={{ width: "40%", height: "0.625rem" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonGraphite}`}>
        <div className={sk.dropSkeleton}>
          <div className={sk.dropInner}>
            <Skeleton style={{ width: "5rem", height: "0.625rem" }} />
            <Skeleton style={{ width: "16rem", height: "2.5rem" }} />
            <Skeleton style={{ width: "12rem", height: "0.875rem" }} />
            <div className={sk.countdownRow}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className={sk.countdownBox} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonMatte}`}>
        <div className={sk.sectionInner}>
          <SectionHeader />
          <div className={sk.communityGridSkeleton}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className={sk.communityItemSkeleton} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonGraphite}`}>
        <div className={sk.sectionInner}>
          <SectionHeader />
          <div className={sk.editorialGridSkeleton}>
            <Skeleton className={sk.editorialFeaturedSkeleton} />
            {[1, 2].map((i) => (
              <Skeleton key={i} style={{ aspectRatio: "4 / 3" }} />
            ))}
          </div>
        </div>
      </section>

      <section className={sk.membershipSkeleton}>
        <div className={sk.membershipInner}>
          <Skeleton style={{ width: "5rem", height: "0.625rem" }} />
          <Skeleton style={{ width: "18rem", height: "2.5rem" }} />
          <Skeleton style={{ width: "100%", height: "0.875rem" }} />
          <Skeleton style={{ width: "85%", height: "0.875rem" }} />
          <div className={sk.perksRow}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className={sk.perkSkeleton} />
            ))}
          </div>
          <div className={sk.signupRowSkeleton}>
            <Skeleton style={{ flex: 1, height: "2.75rem" }} />
            <Skeleton style={{ width: "7rem", height: "2.75rem" }} />
          </div>
        </div>
      </section>

      <section className={`${sk.sectionSkeleton} ${sk.sectionSkeletonGraphite}`}>
        <div className={sk.sectionInner}>
          <div className={sk.contactGridSkeleton}>
            <div className={sk.headerText}>
              <Skeleton style={{ width: "4rem", height: "0.625rem" }} />
              <Skeleton style={{ width: "12rem", height: "2.5rem" }} />
              <Skeleton style={{ width: "100%", height: "0.875rem" }} />
              <Skeleton style={{ width: "90%", height: "0.875rem" }} />
              <Skeleton style={{ width: "10rem", height: "0.75rem", marginTop: "1rem" }} />
              <Skeleton style={{ width: "8rem", height: "0.75rem" }} />
            </div>
            <div className={sk.formSkeleton}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton style={{ width: "3rem", height: "0.625rem", marginBottom: "0.5rem" }} />
                  <Skeleton style={{ width: "100%", height: "2.5rem" }} />
                </div>
              ))}
              <Skeleton style={{ width: "7rem", height: "2.5rem" }} />
            </div>
          </div>
        </div>
      </section>

      <footer className={`${sk.sectionSkeleton} ${sk.sectionSkeletonMatte}`} style={{ paddingTop: "3rem" }}>
        <div className={sk.sectionInner}>
          <div className={sk.footerGridSkeleton}>
            <div className={sk.headerText}>
              <Skeleton style={{ width: "6rem", height: "2rem" }} />
              <Skeleton style={{ width: "12rem", height: "0.75rem" }} />
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} style={{ width: "1.25rem", height: "1.25rem" }} rounded="full" />
                ))}
              </div>
            </div>
            {[1, 2, 3].map((col) => (
              <div key={col} className={sk.footerLinksCol}>
                <Skeleton style={{ width: "4rem", height: "0.625rem", marginBottom: "0.5rem" }} />
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} style={{ width: "5rem", height: "0.625rem" }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
