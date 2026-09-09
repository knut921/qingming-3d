# 虹橋・入畫

可以旋轉、縮放、平移視角的清明上河圖意境 3D 網站，包含 98 位人物與 30 秒場景動畫。訪客使用一般瀏覽器即可觀看，不需要安裝 Blender。

**線上體驗：[虹橋・入畫](https://knut921.github.io/qingming-3d/)**

![虹橋立體場景](public/poster.png)

## 操作

| 裝置 | 操作 |
|---|---|
| 滑鼠 | 左鍵拖曳旋轉、滾輪縮放、右鍵拖曳平移 |
| 手機與平板 | 單指旋轉、雙指縮放或平移 |
| 視角按鈕 | 全景、橋上市集、河上舟行、河岸人家 |
| 動畫 | 播放、暫停、拖曳時間軸、0.5×／1×／1.5× |
| 鍵盤（先點選 3D 場景） | 空白鍵播放／暫停、＋／− 縮放、R 重設視角 |

動畫播放至 30 秒後停止，按播放即可重播。自由視角不受原影片攝影機限制。網頁會尊重作業系統的「減少動態效果」設定，啟用時預設暫停。

## 本機預覽

macOS 直接雙擊 `本機預覽.command`，不需要先切換終端機資料夾，也不需要安裝 Node.js。

開發者可以使用 Node.js 22.12 以上的相容版本：

```bash
npm ci
npm run dev
```

## GitHub Pages 發佈設定

本專案已發佈至 [knut921/qingming-3d](https://github.com/knut921/qingming-3d)，公開網址為 **https://knut921.github.io/qingming-3d/**。

儲存庫 **Settings → Pages** 已設定為 **Deploy from a branch → main → /docs**。不必重新建立儲存庫或再次啟用 Pages；之後更新並推送 `main` 分支即可。

`docs/` 已經是可直接發佈的完整網站，包含網頁、模型、解碼器與影片。JavaScript 依賴已打包，不需要伺服器後端。所有資產都使用相對路徑，適合 GitHub Pages 的專案子路徑。

修改程式後執行：

```bash
npm run build
git add .
git commit -m "Update interactive scene"
git push
```

`npm run build` 會同步更新 `docs/`，GitHub Pages 會從新提交重新發佈。

## 模型與效能

- `public/models/qingming.glb`：約 6.6 MB，Meshopt 壓縮，98 個人物骨架、1 組完整 30 秒場景動畫。
- 新增兩位依服裝與髮型參考製作的微縮訪客，藏在橋上市集；各有 15 根骨骼，以及獨立的張望、手勢、眨眼與站姿動畫。外觀為風格化幾何建模。
- `public/tour.mp4`：原先製作的 30 秒、96 人版本影片；新增訪客請在互動場景中尋找。
- Blender 程序材質轉為網頁頂點色，減少材質切換；網頁燈光與離線影片略有差異。
- `.blend`、720 格渲染 PNG、原始未壓縮 GLB、Node 套件與快取均不納入網站 Git 儲存庫。
- 公開網站會讓訪客取得載入的 3D 模型，頁面也提供 GLB 下載。

這是依使用者提供的原畫局部所做的風格化重建，並非逐一精確還原原畫人物或歷史建築。

## 驗證

已在 Chrome 測試桌面 1440 × 960、手機 390 × 844、播放與暫停、時間拖曳、骨架姿勢變化、兩位新增訪客的載入與獨立頭部／手臂動畫、旋轉、平移、縮放、預設視角、下載與減少動態效果。可執行 `npm run test:browser` 重跑；預設測試本機連接埠 4173，可用 `VIEWER_URL` 指定其他網址。

GLB 結構驗證沒有錯誤；驗證器對 Meshopt 延伸支援有限，並會對骨架位於父節點下提出一般警告，實際瀏覽器的模型與動作已另外檢查。

## 技術參考

- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [GitHub Pages 發佈來源設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Three.js 及 Meshopt 的第三方授權見 `THIRD_PARTY_NOTICES.md`。模型與動畫由本專案程式建立；此儲存庫未指定額外的再授權條款。
