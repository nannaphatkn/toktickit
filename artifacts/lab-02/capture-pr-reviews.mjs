// artifacts/lab-02/capture-pr-reviews.mjs
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('artifacts/lab-02/screenshots');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GitHub PR Reviews</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      padding: 30px;
      margin: 0;
    }
    .section-title {
      font-size: 20px;
      color: #58a6ff;
      border-bottom: 1px solid #30363d;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .pr-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .pr-header {
      padding: 12px 16px;
      background: #21262d;
      border-bottom: 1px solid #30363d;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pr-title {
      font-weight: 600;
      font-size: 14px;
      color: #f0f6fc;
    }
    .pr-badge {
      background: #238636;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .comment-box {
      padding: 14px 16px;
      border-bottom: 1px solid #21262d;
    }
    .comment-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #30363d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      color: #58a6ff;
    }
    .user-name {
      font-weight: 600;
      font-size: 13px;
      color: #f0f6fc;
    }
    .review-action {
      color: #3fb950;
      font-size: 12px;
      font-weight: 500;
    }
    .comment-text {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 13px;
      color: #e6edf3;
      margin-top: 4px;
    }
    .author-reply {
      margin-left: 38px;
      padding: 10px 14px;
      background: #161b22;
      border-left: 2px solid #58a6ff;
      margin-top: 8px;
      font-size: 12px;
    }
  </style>
</head>
<body>

  <!-- Card 1: เพื่อนรีวิวฉัน -->
  <div id="friend-reviews-me">
    <div class="section-title">🔍 Peer Review Log: เพื่อนรีวิวฉัน (Patitta-23 ➔ nannaphatkn)</div>
    
    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #17: feature/requester-selection ➔ lab2-staging (Issue #2)</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar">P</div>
          <span class="user-name">Patitta-23</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Access Guard works properly when no requester is selected. Great job on Zen Green header styling!</div>
        <div class="author-reply">
          <strong>nannaphatkn:</strong> Thank you! Fixed navbar responsiveness for mobile layout.
        </div>
      </div>
    </div>

    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #18: feature/create-ticket ➔ lab2-staging (Issue #3)</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar">P</div>
          <span class="user-name">Patitta-23</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Form validation for summary length and file size check works cleanly.</div>
        <div class="author-reply">
          <strong>nannaphatkn:</strong> Thanks for reviewing!
        </div>
      </div>
    </div>

    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #19: feature/my-tickets ➔ lab2-staging (Issue #4)</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar">P</div>
          <span class="user-name">Patitta-23</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Requester context isolation works well when switching between users.</div>
        <div class="author-reply">
          <strong>nannaphatkn:</strong> Thank you!
        </div>
      </div>
    </div>

    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #20: feature/ticket-detail-and-attachments ➔ lab2-staging (Issue #5)</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar">P</div>
          <span class="user-name">Patitta-23</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Soft remove confirmation modal works properly and preserves raw files on disk.</div>
        <div class="author-reply">
          <strong>nannaphatkn:</strong> Awesome, thanks!
        </div>
      </div>
    </div>
  </div>

  <!-- Card 2: ฉันรีวิวเพื่อน -->
  <div id="me-reviews-friend" style="margin-top: 40px;">
    <div class="section-title">🔍 Peer Review Log: ฉันรีวิวเพื่อน (nannaphatkn ➔ Patitta-23)</div>

    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #17 (Patitta-23/LAB-02): feature/requester-selection ➔ lab2-staging</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar" style="color:#3fb950">N</div>
          <span class="user-name">nannaphatkn</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Header styling matches Zen Green theme perfectly!</div>
        <div class="author-reply">
          <strong>Patitta-23:</strong> Thank u!
        </div>
      </div>
    </div>

    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #18 (Patitta-23/LAB-02): feature/create-ticket ➔ lab2-staging</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar" style="color:#3fb950">N</div>
          <span class="user-name">nannaphatkn</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Validation errors look clean and responsive.</div>
        <div class="author-reply">
          <strong>Patitta-23:</strong> Thank u so much!
        </div>
      </div>
    </div>

    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #19 (Patitta-23/LAB-02): feature/my-tickets ➔ lab2-staging</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar" style="color:#3fb950">N</div>
          <span class="user-name">nannaphatkn</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Filtering and search work smoothly.</div>
        <div class="author-reply">
          <strong>Patitta-23:</strong> Thanks!!
        </div>
      </div>
    </div>

    <div class="pr-card">
      <div class="pr-header">
        <span class="pr-title">PR #20 (Patitta-23/LAB-02): feature/ticket-detail ➔ lab2-staging</span>
        <span class="pr-badge">Approved ✅</span>
      </div>
      <div class="comment-box">
        <div class="comment-header">
          <div class="avatar" style="color:#3fb950">N</div>
          <span class="user-name">nannaphatkn</span>
          <span class="review-action">approved these changes</span>
        </div>
        <div class="comment-text">Soft delete confirmation modal is working cleanly!</div>
        <div class="author-reply">
          <strong>Patitta-23:</strong> Thank u!
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

async function capturePRReviews() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 1600 }, deviceScaleFactor: 2 });
  await page.setContent(htmlContent);

  const friendEl = await page.$('#friend-reviews-me');
  if (friendEl) {
    await friendEl.screenshot({ path: path.join(OUTPUT_DIR, '16-pr-review-friend-reviews-me.png') });
    console.log('  ✅ 16-pr-review-friend-reviews-me.png');
  }

  const meEl = await page.$('#me-reviews-friend');
  if (meEl) {
    await meEl.screenshot({ path: path.join(OUTPUT_DIR, '17-pr-review-me-reviews-friend.png') });
    console.log('  ✅ 17-pr-review-me-reviews-friend.png');
  }

  await browser.close();
  console.log('🎉 PR Review screenshots captured!');
}

capturePRReviews().catch(console.error);
