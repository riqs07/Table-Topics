
function enableMenuButtons(type){

    switch (type){
        case 'disabled':
       btnPlay.classList.add('disabled')
      btnSettings.classList.add('disabled')
      break;

        case 'enabled':
        btnPlay.classList.remove('disabled')
      btnSettings.classList.remove('disabled')
        break;
    }

}

function showToastAlert(msg, type) {
    let color;

    switch (type) {
        case 'success':
            color = 'green lighten-2';
            break;

        case 'alert':
            color = 'red lighten-2';
            break;

        case 'finish':
        color = 'blue lighten-3';
        break;
    }

    M.toast({

        html: `${msg} `,
        displayLength: 2500,
        classes: `z-depth-3 test ${color}`,
        
    })
}

function changeCardColor(color){
    background.style.backgroundColor = color
}

function showGameButtons(type){

    switch (type){
        case 'show':
        btnPause.style.display = "inline"
        btnResume.style.display = "inline"
        btnReset.style.display = "inline"
        btnStop.style.display = "inline"
        btnRecord.style.display = "inline"
        break;

        case 'hide':
        btnPause.style.display = "none"
        btnResume.style.display = "none"
        btnReset.style.display = "none"
        btnStop.style.display = "none"
        btnRecord.style.display = "none"
        break;
    }

}

function openSettings(){
    settingsCard.style.display = "block";
    btnPlay.classList.add('disabled')
}

function closeSettings(){
    settingsCard.style.display = "none";
    displayCard.style.display = "none"

    btnPlay.classList.remove('disabled')
    changeDisplayState
}

function closeDisplayCard(){
    displayCard.style.display = "none";
}

function SettingsToggle() {
    if (settingsCard.style.display == "block") {
        closeSettings();

    } else if (settingsCard.style.display == "none") {
        openSettings()
    }

}

function showQuestionsArray() {

    displayCard.style.display = "block"
    document.querySelector('#edit-question-list').innerHTML = ''

    questions.forEach(entry => {

        let li = document.createElement('li');
        li.className = "collection-item new-question";
        li.id = `question-${entry.id}`;
        li.innerHTML =
            `
        <b>${entry.question}:</b> <em> ${entry.diffuculty} </em>
        
        <a href="#" class="secondary-content"><i class="edit-item fas fa-edit" onclick = "itemEditClick()"></i></a>
        `
        document.querySelector('#edit-question-list').insertAdjacentElement('beforeend', li)

    });

   showStoredQuestions()


}


function showWODArray(){
    displayCard.style.display = "block"
    document.querySelector('#edit-question-list').innerHTML = ''
    wordOfDay.forEach(entry => {

        let li = document.createElement('li');
        li.className = "collection-item new-wod";
        li.id = `WOD-${entry.id}`;
        li.innerHTML =
            `
        <b>${entry.word}:</b> <em> ${entry.definition} ${entry.partOfSpeech}</em>
        
        <a href="#" class="secondary-content"><i class="edit-item fas fa-edit" onclick = "itemEditClick()"></i></a>
        `
        document.querySelector('#edit-question-list').insertAdjacentElement('beforeend', li)

    });
    showStoredWords()

}




function updateQuestionListInUI(id){
 
    question = getQuestionEditStateInputs();

    let questionsList = document.querySelectorAll('.collection-item')

    questionsListArray = Array.from(questionsList)

    questionsListArray.forEach(entry =>{
        if (entry.id === `question-${id}`){
            entry.innerHTML = `
            <b>${question.updatedQuestion}:</b> <em> ${question.updatedDiffuculty} </em>
            
            <a href="#" class="secondary-content"><i class="edit-item fas fa-edit" onclick = "itemEditClick"></i></a>
            `        
        }
    })
}

function updateWODListInUI(id){
 
    word = getWODEditStateInputs();

    let wordList = document.querySelectorAll('.collection-item')

    wordListArray = Array.from(wordList)

    wordListArray.forEach(entry =>{
        if (entry.id === `WOD-${id}`){
            entry.innerHTML = `
            <b>${word.updatedWord}:</b> <em> ${word.updatedDefinition} ${word.updatedPartOfSpeech} </em>
            
            <a href="#" class="secondary-content"><i class="edit-item fas fa-edit" onclick = "itemEditClick"></i></a>
            `        
        }
    })

}

function deleteFromQuestionListInUI(id){
 
    let questionsList = document.querySelectorAll('.collection-item')

    questionsListArray = Array.from(questionsList)

    questionsListArray.forEach(entry =>{
        if (entry.id === `question-${id}`){
            entry.remove();  
        }
    })

}


function deleteFromWODListInUI(id){
 
    let wordList = document.querySelectorAll('.collection-item')

    wordListArray = Array.from(wordList)

    wordListArray.forEach(entry =>{
        if (entry.id === `WOD-${id}`){
            entry.remove();  
        }
    })

}


