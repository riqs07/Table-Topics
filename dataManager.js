    function createNewQuestionID() {

        length = questions.length;

        let newID;

        if (length > 0) {
            newID = questions[length -1].id + 1
        } else {
            newID = 0
        }

        
        return newID;
    }

    function createNewWordID() {

        length = wordOfDay.length;

        let newID;

        if (length > 0) {
            newID = questions[length -1].id + 1
        } else {
            newID = 0
        }


        return newID;
    }


    function deleteFromQuestionsArray(id) {
        ids = questions.map(entry => entry.id)
        const index = ids.indexOf(id)
        questions.splice(index, 1)
    }

    function deleteFromWODArray(id) {
        ids = wordOfDay.map(entry => entry.id)
        const index = ids.indexOf(id)
        wordOfDay.splice(index, 1)
    }


    function addToQuestionsArray() {
        question = getQuestionEditStateInputs();

        newQuesitonInput = {
            id: createNewQuestionID(),
            question: question.updatedQuestion,
            diffuculty: question.updatedDiffuculty

        }

        questions.push(newQuesitonInput)
        storeItem(newQuesitonInput,'question')
    }

    function addToWODArray() {
        word = getWODEditStateInputs();

        newWordInput = {
            id: createNewWordID(),
            word: word.updatedWord,
            definition: word.updatedDefinition,
            partOfSpeech: word.updatedPartOfSpeech

        }

        wordOfDay.push(newWordInput)
        storeItem(newWordInput,'word')
    }




    function updateQuestionArray(id) {
        question = getQuestionEditStateInputs()

        questions[id].question = question.updatedQuestion;
        questions[id].diffuculty = question.updatedDiffuculty;

    }

    function updateWODArray(id) {
        word = getWODEditStateInputs()

        wordOfDay[id].word = word.updatedWord;
        wordOfDay[id].definition = word.updatedDefinition;
        wordOfDay[id].partOfSpeech = word.updatedPartOfSpeech;

    }


    function getQuestionInDataByID(id) {
        let found = null;

        questions.forEach((question) => {
            if (question.id == id) {
                found = question;
            }
        })


        return found;
    }

    function getWODinDataByID(id) {
        let found = null;

        wordOfDay.forEach((word) => {
            if (word.id == id) {
                found = word;
            }
        })


        return found;
    }


    function getSelectedItemToEditbyID(target) {
        const listId = target.parentNode.parentNode.id;

        const listIdArray = listId.split('-');

        const id = parseInt(listIdArray[1]);

        return id;
    }


    function itemEditClick(e) {

        const li = e.target.parentNode.parentNode;

        if (e.target.classList.contains('edit-item')) {


            id = getSelectedItemToEditbyID(e.target);

            if (li.classList.contains('new-question')) {
                const questionToEdit = getQuestionInDataByID(id);
                editQuestionState(questionToEdit);

            } else if (li.classList.contains('new-wod')) {
                const wodToEdit = getWODinDataByID(id);
                editWODState(wodToEdit)
            }
        }
        e.preventDefault();
    };


    function fillQuestionRadioButton(diffuculty) {

        switch (diffuculty) {
            case 'easy':
                document.getElementById('easyRadio').setAttribute('checked', true);
                break;
            case 'medium':
                document.getElementById('medRadio').setAttribute('checked', true);
                break;
            case 'hard':
                document.getElementById('hardRadio').setAttribute('checked', true);
                break;
        }

    }

    function fillWODRadioButton(partOfSpeech) {

        switch (partOfSpeech) {
            case 'Noun':
                document.getElementById('nounRadio').setAttribute('checked', true);
                break;
            case 'Verb':
                document.getElementById('verbRadio').setAttribute('checked', true);
                break;
            case 'Adjective':
                document.getElementById('adjRadio').setAttribute('checked', true);
                break;
            case 'Adverb':
                document.getElementById('adverbRadio').setAttribute('checked', true);
                break;
        }

    }


    function getQuestionDiffuculty() {

        let diffuculty;

        switch (true) {
            case document.getElementById('easyRadio').checked:
                diffuculty = 'easy'
                break;

            case document.getElementById('medRadio').checked:
                diffuculty = 'medium'
                break;


            case document.getElementById('hardRadio').checked:
                diffuculty = 'hard'
                break;
        }

        return diffuculty;
    }


    function getWODPartOfSpeech() {

        let partOfSpeech;

        switch (true) {
            case document.getElementById('verbRadio').checked:
                partOfSpeech = 'Verb'
                break;

            case document.getElementById('adjRadio').checked:
                partOfSpeech = 'Adjective'
                break;

            case document.getElementById('nounRadio').checked:
                partOfSpeech = 'Noun'
                break;

            case document.getElementById('adverbRadio').checked:
                partOfSpeech = 'Adberb'
                break;
        }

        return partOfSpeech;

    }


    function getQuestionEditStateInputs() {

        const newQuestion = document.getElementById('addQuestionInput').value;
        const diffuculty = getQuestionDiffuculty();

        return {
            updatedQuestion: newQuestion,
            updatedDiffuculty: diffuculty
        };

    }

    function getWODEditStateInputs() {

        const newWord = document.getElementById('addWordInput').value;
        const definition = document.getElementById('addDefinitionInput').value;
        const partOfSpeech = getWODPartOfSpeech()

        return {
            updatedWord: newWord,
            updatedDefinition: definition,
            updatedPartOfSpeech: partOfSpeech
        };

    }
  

    function validateWordInputs() {
        input = getWODEditStateInputs()
        if (input.updatedWord !== '' &&
            input.updatedDefinition !== '' &&
            input.updatedPartOfSpeech != undefined) {
            return true
        } else {
            return false
        }
    }

    function validateQuestionInputs(){
        input = getQuestionEditStateInputs()

        if (input.updatedQuestion !== '' && input.updatedDiffuculty !== undefined){
            return true;
        } else {
            return false
        }
    }

    function getWordErrorMessage() {
        let msg;
        switch (true) {

            case (input.updatedPartOfSpeech == undefined && input.updatedDefinition == '' && input.updatedWord == ''):
                msg = 'Please add something! Anything!'
                break;

            case (input.updatedPartOfSpeech == undefined && input.updatedDefinition == ''):
                msg = 'Please add a definition and a part of Speech.'
                break;

            case (input.updatedPartOfSpeech == undefined && input.updatedWord == ''):
                msg = 'Please add a word and a part of Speech.'
                break;

            case (input.updatedDefinition == undefined && input.updatedWord == ''):
                msg = 'Please add a word and a definitoh.'
                break;

            case (input.updatedWord == ''):
                msg = 'Please add a word.'
                break;

            case (input.updatedDefinition == ''):
                msg = 'Please add a part a Definition.'
                break;

            case (input.updatedPartOfSpeech == undefined):
                msg = 'Please add a part of Speech.'
                break;
        }
        return msg;
    }

    function getQuestionErrorMessage() {
        let msg;
        switch (true) {

            case (input.updatedDiffuculty == undefined && input.updatedQuestion == ''):
                msg = 'Please add Something! Anything!.'
                break;

            case (input.updatedDiffuculty == undefined):
                msg = 'Please add a Diffuculty.'
                break;

            case (input.updatedQuestion == ''):
                msg = 'Please add a Question.'
                break;
        }
        return msg;
    }


    function editQuestionStateDeleteBtn(id) {
        deleteFromQuestionsArray(id)
        deleteFromQuestionListInUI(id)
        showHomeState()
        showToastAlert('Question Deleted!', 'alert')

    }


    function editWODStateDeleteBtn(id) {
        deleteFromWODArray(id)
        deleteFromWODListInUI(id);
        showHomeState()
        showToastAlert('Word Deleted!', 'alert')
    }

    function editQuestionStateUpdateBtn(id) {
        updateQuestionArray(id);
        updateQuestionListInUI(id);
        showHomeState()
        showToastAlert('Question Updated!', 'success')

    }

    function editWODStateUpdateBtn(id) {

        isValid = validateWordInputs()

        if (isValid === true) {
            updateWODArray(id);
            updateWODListInUI(id);
            showHomeState()
            showToastAlert('Question Updated!', 'success')
        } else if (isValid === false) {
            let msg = getWordErrorMessage();
            showToastAlert(`${msg}`, 'alert')
        }

    }


    function addNewQuestion() {

        isValid = validateQuestionInputs()


        if (isValid === true) {

            addToQuestionsArray();
            showQuestionsArray()
            showToastAlert('New Question Added!', 'success')

        } else if (isValid === false){

            let msg = getQuestionErrorMessage();
            showToastAlert(`${msg}`, 'alert')

        }

    }


    function addNewWord() {

        isValid = validateWordInputs()

        if (isValid === true) {
            addToWODArray();
            showWODArray();
            showToastAlert('New Word Added!', 'success')


        } else if (isValid === false) {
            let msg = getWordErrorMessage();
            showToastAlert(`${msg}`, 'alert')

        }
    }