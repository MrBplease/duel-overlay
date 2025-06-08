// File: duel.js

let challenger = null;
let defender = null;
let duelStarted = false;
let duelAccepted = false;
let fireReady = false;
let someoneFired = false;
let countdown = 10;
let intervalId = null;
let fired = {};
let acceptTimeoutId = null;

// === TESTING ONLY ===
document.addEventListener('keydown', (e) => {
  if (e.key === '1') ComfyJS.onCommand('Tester1', 'duel', '@Tester2', {}, {});
  if (e.key === '4') ComfyJS.onCommand('Tester2', 'accept', '', {}, {});
  if (e.key === '2') ComfyJS.onCommand('Tester1', 'fire', '', {}, {});
  if (e.key === '3') ComfyJS.onCommand('Tester2', 'fire', '', {}, {});
});
// === END TESTING ===

// DOM Elements
const overlay = document.getElementById('overlay');
const scoreboard = document.getElementById('scoreboard');
const countdownText = document.getElementById('countdownText');
const challengeText = document.getElementById('challengeText');
const acceptText = document.getElementById('acceptText');
const left = document.getElementById('leftDuelist');
const right = document.getElementById('rightDuelist');
const walkSound = document.getElementById('walkSound');
const fireSound = document.getElementById('fireSound');

function reset() {
  overlay.classList.add('hidden');

  challenger = null;
  defender = null;
  duelStarted = false;
  duelAccepted = false;
  fireReady = false;
  someoneFired = false;
  countdown = 10;
  fired = {};
  clearInterval(intervalId);
  intervalId = null;

  left.className = 'duelist left-idle';
  right.className = 'duelist right-idle';
  moveApartStep(0);

  left.style.transform = 'translateX(300px) scaleX(-1)';
  right.style.transform = 'translateX(-300px) scaleX(-1)';

  countdownText.textContent = '10';
  scoreboard.textContent = 'No duel yet';
  challengeText.textContent = '';
  acceptText.textContent = '';
}

function moveApartStep(step) {
  const maxOffset = 300;
  const offset = maxOffset - ((step / 9) * maxOffset);

  left.style.transform = `translateX(${offset}px) scaleX(1)`;
  right.style.transform = `translateX(-${offset}px) scaleX(1)`;
}

function startDuel(player1, player2) {
  if (intervalId) return;

  overlay.classList.remove('hidden');
  countdownText.textContent = countdown;
  scoreboard.textContent = `${player1} vs ${player2}`;

  left.style.transform = `translateX(300px) scaleX(1)`;
  right.style.transform = `translateX(-300px) scaleX(1)`;

  walkSound.play();

  intervalId = setInterval(() => {
    countdown--;

    if (countdown > 0) {
      countdownText.textContent = countdown;
      moveApartStep(10 - countdown);

    } else if (countdown === 0) {
      countdownText.textContent = 'DRAW!';
      fireSound.play();
      fireReady = true;
      left.style.transform = 'translateX(0px) scaleX(-1)';
      right.style.transform = 'translateX(0px) scaleX(-1)';

    } else if (countdown < -10 && !someoneFired) {
      countdownText.innerHTML = `
         <div><b>Both sides yield</b></div>
         <div>Cooler heads have prevailed</div>
      `;

      clearInterval(intervalId);
      setTimeout(reset, 4000);
    }
  }, 1000);
}

function declareWinner(winner, loser, winnerSide, loserSide) {
  fireReady = false;
  someoneFired = true;
  countdownText.textContent = '';

  document.getElementById(`${winnerSide}Duelist`).className = `duelist ${winnerSide}-shoot`;
  document.getElementById(`${loserSide}Duelist`).className = `duelist ${loserSide}-fallen`;

  countdownText.textContent = `${winner} wins!`;

  setTimeout(reset, 5000);
}

ComfyJS.onCommand = (user, command, message, flags, extra) => {
 if (command === 'duel' && !challenger && !defender) {
  const target = message.split(' ')[0].replace('@', '');
  challenger = user;
  defender = target;

  scoreboard.textContent = `${challenger} vs ${defender}`;
  countdownText.textContent = 'Awaiting acceptance...';
  challengeText.textContent = `${challenger} is ready to fire`;
  acceptText.textContent = `Awaiting ${defender}'s acceptance`;
  overlay.classList.remove('hidden');

  // Set timeout to cancel if not accepted in 10 seconds
  acceptTimeoutId = setTimeout(() => {
    if (!duelAccepted) {
      countdownText.textContent = `${defender} is absent — no challenge`;
      scoreboard.textContent = 'Duel cancelled';
      setTimeout(reset, 5000);
    }
  }, 8000); // 8 seconds
}

if (command === 'accept' && user === defender && !duelStarted && !duelAccepted) {
  clearTimeout(acceptTimeoutId);
  acceptTimeoutId = null;

  duelAccepted = true;
  duelStarted = true;
  challengeText.textContent = '';
  acceptText.textContent = '';
  countdownText.textContent = 'All Parties Accept Terms';
  setTimeout(() => {
    acceptText.textContent = '';
    startDuel(challenger, defender);
  }, 2000);
}

  if (command === 'fire' && duelStarted && duelAccepted) {
    if (!fireReady && !someoneFired) {
      someoneFired = true; // prevents other from firing
      fireReady = false;
      duelStarted = false;
      duelAccepted = false;
      clearInterval(intervalId);

      const misfiringSide = user === challenger ? 'left' : user === defender ? 'right' : null;
      const winnerSide = misfiringSide === 'left' ? 'right' : 'left';
      const winner = misfiringSide === 'left' ? defender : challenger;

      document.getElementById(`${misfiringSide}Duelist`).className = `duelist ${misfiringSide}-fallen`;
      document.getElementById(`${winnerSide}Duelist`).className = `duelist ${winnerSide}-idle`; // or use winnerSide-shoot for dramatic effect

      left.style.transform = 'scaleX(-1)';
      right.style.transform = 'scaleX(-1)';
      
      countdownText.innerHTML = `
         <div>${winner} wins!</div>
         <div>${user} fired too early and DIED!</div>
      `;
       
       fireSound.play();

       setTimeout(reset, 5000);
}    

 else if (fireReady && !someoneFired) {
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
ComfyJS.Init("mrbplease");
