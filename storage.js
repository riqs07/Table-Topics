function storeItem(item,type){


    switch (type){
        case 'word':
        let wordStorage;
        if (localStorage.getItem('wordStorage') === null) {
            wordStorage = [];
            wordStorage.push(item);
            localStorage.setItem('wordStorage', JSON.stringify(wordStorage))

        } else {
            wordStorage = JSON.parse(localStorage.getItem('wordStorage'))

            wordStorage.push(item);
            localStorage.setItem('wordStorage', JSON.stringify(wordStorage))
        }
        break;

        case 'question':
        let questionStorage;
        if (localStorage.getItem('questionStorage') === null) {
            questionStorage = [];
            questionStorage.push(item);
            localStorage.setItem('questionStorage', JSON.stringify(questionStorage))

        } else {
            questionStorage = JSON.parse(localStorage.getItem('questionStorage'))

            questionStorage.push(item);
            localStorage.setItem('questionStorage', JSON.stringify(questionStorage))
        }
        break;
   

    }
}


function showStoredQuestions(){
    if (localStorage !== null){
        parsedStorage = JSON.parse(localStorage.questionStorage)
    storedQuestions = Array.from(parsedStorage)
    storedQuestions.forEach(entry => {

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
    }
}

function showStoredWords(){

    


    if (localStorage !== null){
        parsedStorage = JSON.parse(localStorage.wordStorage)
        storedWords = Array.from(parsedStorage)


        let list = document.querySelectorAll('.collection-item')
        listArray = Array.from(list)

        console.log(list)

        storedWords.forEach(entry => {
    
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
    }

}

function deleteItemFromStorage(id,type){
    switch (type){
        case 'question':
        let storedQuestions = JSON.parse(localStorage.getItem('questionStorage'));
        storedQuestions.forEach(entry => {
            console.log('foo')

            if (id === entry.id){
                console.log('goo')
                storedQuestions.splice(0,1)
        
            }
        });
        break;


        case 'word':
        break;
    }
}
    
    


function clearStorage(){
    localStorage.clear();
    showToastAlert('Local Storage Cleared','success')
}
