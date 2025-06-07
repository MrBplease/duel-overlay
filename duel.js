// File: duel.js
let challenger = null;
let defender = null;
let duelStarted = false;
let fireReady = false;
let fired = {};
let countdown = 10;
let intervalId = null;
let someoneFired = false; // 🟩 NEW: Prevents second fire from being processed

// === TESTING ONLY ===
document.addEventListener('keydown', (e) => {
  if (e.key === '1') startDuel('Tester1', 'Tester2');
  if (e.key === '2') ComfyJS.onCommand('Tester1', 'fire', '', {}, {});
  if (e.key === '3') ComfyJS.onCommand('Tester2', 'fire', '', {}, {});
});
// === END TESTING ===

// DOM Elements
const scoreboard = document.getElementById('scoreboard');
const countdownText = document.getElementById('countdownText');
const left = document.getElementById('leftDuelist');
const right = document.getElementById('rightDuelist');
const walkSound = document.getElementById('walkSound');
const fireSound = document.getElementById('fireSound');

function reset() {
  challenger = null;
  defender = null;
  duelStarted = false;
  fireReady = false;
  fired = {};
  someoneFired = false;
  countdown = 10;
  clearInterval(intervalId);

  left.className = 'duelist left-idle';
  right.className = 'duelist right-idle';

  // 🟨 Reset to default inward-facing, ready stance
  left.style.transform = 'translateX(300px) scaleX(-1)';
  right.style.transform = 'translateX(-300px) scaleX(-1)';

  countdownText.textContent = '10';
  scoreboard.textContent = 'No duel yet';
}

function moveApartStep(step) {
  const maxOffset = 300;
  const offset = maxOffset - ((step / 10) * maxOffset);

  // 🟨 Outward-facing and moving outward
  left.style.transform = `translateX(${offset}px) scaleX(1)`;
  right.style.transform = `translateX(-${offset}px) scaleX(1)`;
}

function startDuel(player1, player2) {
  if (duelStarted) return;

  challenger = player1;
  defender = player2;
  duelStarted = true;

  scoreboard.textContent = `${challenger} vs ${defender}`;
  countdownText.textContent = countdown;

  // 🟨 Start facing inward, at edges
  left.style.transform = `translateX(300px) scaleX(-1)`;
  right.style.transform = `translateX(-300px) scaleX(-1)`;

  walkSound.play();

  intervalId = setInterval(() => {
    countdown--;

    if (countdown > 0) {
      countdownText.textContent = countdown;
      moveApartStep(10 - countdown);

      if (countdown === 9) {
        // 🟨 Flip outward at walk
        left.style.transform = 'translateX(300px) scaleX(1)';
        right.style.transform = 'translateX(-300px) scaleX(1)';
      }

    } else if (countdown === 0) {
      countdownText.textContent = 'DRAW!';
      fireSound.play();
      fireReady = true;

      // 🟨 Flip inward and meet in center
      left.style.transform = 'translateX(0px) scaleX(-1)';
      right.style.transform = 'translateX(0px) scaleX(-1)';

    } else if (countdown < -10 && !someoneFired) {
      scoreboard.textContent = 'Both sides yield: Cooler heads have prevailed';
      clearInterval(intervalId);
      setTimeout(reset, 4000);
    }
  }, 1000);
}

function declareWinner(user, loserUser, winnerSide, loserSide) {
  fireReady = false;
  someoneFired = true;
  countdownText.textContent = '';

  document.getElementById(`${winnerSide}Duelist`).className = `duelist ${winnerSide}-shoot`;
  document.getElementById(`${loserSide}Duelist`).className = `duelist ${loserSide}-fallen`;

  scoreboard.textContent = `${user} wins!`;

  setTimeout(reset, 5000);
}

// === Twitch Listener ===
ComfyJS.onCommand = (user, command, message, flags, extra) => {
  if (command === 'duel' && !duelStarted) {
    const target = message.split(' ')[0].replace('@', '');
    startDuel(user, target);
  }

  if (command === 'fire' && duelStarted) {
    if (!fireReady) {
      // ❌ Fired too early
      const misfiringSide = user === challenger ? 'left' : user === defender ? 'right' : null;
      if (misfiringSide) {
        const winnerSide = misfiringSide === 'left' ? 'right' : 'left';
        const winner = misfiringSide === 'left' ? defender : challenger;
        declareWinner(winner, user, winnerSide, misfiringSide);
      }

    } else if (!someoneFired) {
      // ✅ First correct fire after DRAW
      fired[user] = true;
      someoneFired = true;

      const winner = user;
      const loser = user === challenger ? defender : challenger;
      const winnerSide = user === challenger ? 'left' : 'right';
      const loserSide = user === challenger ? 'right' : 'left';

      declareWinner(winner, loser, winnerSide, loserSide);
    }
  }
};

reset();
ComfyJS.Init("YourTwitchUsername");
