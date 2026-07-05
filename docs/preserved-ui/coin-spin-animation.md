# Preserved UI — "G" coin spin animation (My Applications header)

> Archived: 2026-06-22 3:30 PM (UTC-4)
> Why kept: hand-tuned 3D spinning gold coin from the original token/currency design. The
> application-limit UX is being de-gamified to plain "Applications Remaining" text for MVP, but
> this coin is wanted for future use (post-MVP monetization / G-Coins reintroduction).
> Source before removal: `public/css/my-applications.css` (~lines 5–204) and
> `my-applications.html` (~lines 33–48).

## How to reuse later
1. Drop the markup back into a header/strip container on the target page.
2. Paste the CSS into that page's stylesheet.
3. The spin is `@keyframes coinSpin` (3D `rotateY`) applied to `.coin-status-coin` as
   `coinSpin 4s linear infinite`. The `⏳` loading state uses `@keyframes coinCountLoadingSpin`.
4. NOTE: `@keyframes coinSpin` also exists separately in `public/css/profile.css` (the wallet
   coin). They are page-scoped and independent — don't assume one drives the other.

## Markup (from `my-applications.html`)
```html
<section class="role-tabs coin-status-strip" id="coinStatusStrip" aria-live="polite">
    <div class="coin-status-content">
        <div class="coin-status-text">
            <div class="coin-status-main">
                <span class="coin-status-value loading" id="coinStatusValue">0</span>
                <div class="coin-status-float" aria-hidden="true">
                    <div class="coin-status-coin">
                        <span class="coin-status-letter">G</span>
                    </div>
                </div>
                <span class="coin-status-suffix">TOKENS REMAINING</span>
            </div>
            <div class="coin-status-caption" id="coinStatusCaption"></div>
        </div>
    </div>
</section>
```

## CSS (from `public/css/my-applications.css`)
```css
.page-my-applications .coin-status-strip {
  position: fixed;
  margin-left: 0;
  align-items: center;
  justify-content: center;
  height: 70px;
  min-height: 70px;
  padding: 5px 12px;
  gap: 0;
  box-sizing: border-box;
  border-top: 1px solid rgba(14, 165, 233, 0.35);
  border-bottom: 1px solid rgba(14, 165, 233, 0.22);
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.9), rgba(30, 58, 138, 0.22));
}

.coin-status-content {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.coin-status-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.coin-status-main {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  width: 100%;
}

.coin-status-value {
  font-size: 1.82rem;
  font-weight: 900;
  color: #fbbf24;
  line-height: 1;
  letter-spacing: 0.3px;
  text-shadow: 0 0 16px rgba(251, 191, 36, 0.35);
  text-transform: uppercase;
}

.coin-status-value.loading {
  position: relative;
  color: transparent;
  text-shadow: none;
  min-width: 1.8rem;
}

.coin-status-value.loading::before {
  content: '⏳';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #93c5fd;
  font-size: 1.05rem;
  animation: coinCountLoadingSpin 1.2s linear infinite;
}

.coin-status-suffix {
  font-size: 1.02rem;
  font-weight: 800;
  color: #9dd6ff;
  line-height: 1;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.coin-status-caption {
  font-size: 0.85rem;
  color: #cfe6ff;
  line-height: 1.05;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coin-status-strip.low .coin-status-value {
  color: #fb923c;
}

.coin-status-float {
  position: relative;
  width: 44px;
  height: 44px;
  margin: 0;
  opacity: 1;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.coin-status-coin {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 2px #f59e0b,
    0 4px 8px rgba(251, 191, 36, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  position: relative;
  transform-origin: center;
  animation: coinSpin 4s linear infinite;
}

.coin-status-coin::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 20%;
  width: 30%;
  height: 30%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(2px);
}

.coin-status-letter {
  position: relative;
  font-size: 1.2rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-family: Arial, Helvetica, sans-serif;
  z-index: 1;
}

@media (max-width: 600px) {
  .page-my-applications .coin-status-strip {
    height: 60px;
    min-height: 60px;
    padding: 4px 10px;
  }

  .coin-status-content {
    padding: 0;
    gap: 8px;
  }

  .coin-status-float {
    margin-right: 4px;
  }

  .coin-status-value {
    font-size: 1.45rem;
  }

  .coin-status-suffix {
    font-size: 0.86rem;
  }

  .coin-status-caption {
    font-size: 0.72rem;
  }

  .coin-status-coin {
    width: 2.2rem;
    height: 2.2rem;
  }

  .coin-status-letter {
    font-size: 1rem;
  }
}

@keyframes coinSpin {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(360deg);
  }
}

@keyframes coinCountLoadingSpin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
```
