const Palette = {
    green: "#81c784",
    yellow: "#fff176",
    red: "#e57373",
    grey: "#bdbdbd  "
}

let time = 0;
let countdownTime = 6;





function getUISelectors(){

    timer = document.getElementById('timer');
    questionDisplay = document.querySelector('#main-display');
    background = document.querySelector('.background')
    countDownTimerDisplay = document.querySelector('#countdown')
    wordOTD = document.querySelector('#WOD')


    btnPause = document.querySelector('#pause')
    btnStop = document.querySelector('#stop')
    btnRecord = document.querySelector('#record')
    btnResume =document.querySelector('#resume')
    btnPlay = document.querySelector('#play')
    btnReset =  document.querySelector('#reset')
    btnSettings = document.querySelector('#settings')

    settingsCard =  document.querySelector('.settings-card');
    displayCard = document.querySelector('.display-card')

    

}

function getEventListeners(){
  
    btnPause.addEventListener('click', pauseTimer);

    btnResume.addEventListener('click', resumeGame);

    btnPlay.addEventListener('click', playGame);

    btnReset.addEventListener('click',resetGame);

    btnStop.addEventListener('click',stopGame);

    btnSettings.addEventListener('click',SettingsToggle);
    
    document.querySelector("#edit-question-list")
        .addEventListener('click',itemEditClick)

    // document.querySelector('#settings-done-btn')
    //     .addEventListener('click',closeSettings)


}

function init(){
  
    getUISelectors();
    getEventListeners();
  
    displayCard.style.display = "none"
    countDownTimerDisplay.style.display = "none"
    settingsCard.style.display = "none"

    showGameButtons('hide');
  
    M.AutoInit();

}



init()