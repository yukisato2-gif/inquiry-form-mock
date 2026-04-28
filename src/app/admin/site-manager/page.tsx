"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import {
  LOCATION_AREAS,
  LOCATION_AREA_LABELS,
  LOCATIONS_BY_AREA,
} from "@/lib/constants";

export default function SiteManagerSelectPage() {
  const router = useRouter();
  const setCurrentSiteLocation = useAppStore((s) => s.setCurrentSiteLocation);

  const selectLocation = (loc: string) => {
    setCurrentSiteLocation(loc);
    router.push("/admin/site-manager/posts");
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3748]">拠点を選択</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#7A746E]">
          ご担当の拠点を選択してください。選択した拠点の投稿のみが表示されます。
        </p>
      </div>

      <div className="space-y-5">
        {LOCATION_AREAS.map((area) => (
          <section
            key={area}
            className="rounded-xl border-[1.5px] border-border bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="mb-3 text-[14px] font-bold text-[#4A4540]">
              {LOCATION_AREA_LABELS[area]}
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LOCATIONS_BY_AREA[area].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => selectLocation(loc)}
                  className="flex items-center justify-between rounded-lg border-[1.5px] border-border bg-white px-4 py-2.5 text-left text-[13px] font-medium text-[#4A4540] transition-colors hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700"
                >
                  <span>{loc}</span>
                  <span className="ml-2 text-[11px] text-[#B0A9A2]">選択 →</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-[#9B9590]">
        ※この画面はモックです。本番ではログイン認証とサーバー側の権限制御が必要です。
      </p>
    </main>
  );
}
