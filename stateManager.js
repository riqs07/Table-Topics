function changeDisplayState(element){
    questionDisplay.innerHTML = element;
}

function editQuestionState(item) {
        element =
            ` 
    
    <form class = "form">
    <div class="input-field">
            <input type="text" value="${item.question}" id ="addQuestionInput" class="validate active">
            <label for="addQuestionInput">Edit Question</label>
            </div>

            <label for = "easyRadio">
            <input class="with-gap " name ="diffucltyRadioGroup" type="radio" id = "easyRadio" value = 'easy'/>
            <span> Easy </span>
            </label>


            <label for = "medRadio">
            <input class="with-gap "  name ="diffucltyRadioGroup" type="radio" id = "medRadio" value = 'medium' />
            <span>Medium</span>
            </label>
    
            <label for = "hardRadio">
            <input class="with-gap " name ="diffucltyRadioGroup" type="radio" id = "hardRadio" value = 'hard'/>
            <span>Hard</span>
            </label>

       
    </form> 

    <br>
    <button class="btn green settings-questions-btn" onclick = "editQuestionStateUpdateBtn(${item.id})"><i class="fas fa-pencil-alt"></i> </button>   

    <button class="btn red settings-questions-btn" onclick = "editQuestionStateDeleteBtn(${item.id})"><i class="fas fa-times"></i> </button>
    <button class="btn teal lighten-1  settings-questions-btn" onclick= "showHomeState()" >Back</button>   
 </div>        

    `

        changeDisplayState(element);
        fillQuestionRadioButton(item.diffuculty);
        M.updateTextFields();

    }


function addNewQuestionState() {
        element = `
        <form class = "form">

    <div class="input-field">
    <input type="text" placeholder= "New Question" id ="addQuestionInput" class="validate active">
    <label for="addQuestionInput">Add New Question</label>
    </div>

    <label for = "easyRadio">
    <input class="with-gap " name ="diffucltyRadioGroup" type="radio" id = "easyRadio" value = 'easy'/>
    <span> Easy </span>
    </label>


    <label for = "medRadio">
    <input class="with-gap "  name ="diffucltyRadioGroup" type="radio" id = "medRadio" value = 'medium' />
    <span>Medium</span>
    </label>

    <label for = "hardRadio">
    <input class="with-gap " name ="diffucltyRadioGroup" type="radio" id = "hardRadio" value = 'hard'/>
    <span>Hard</span>
    </label>


</form> 
<br>
<button class="btn blue settings-questions-btn" onclick = "addNewQuestion()"> <i class="fas fa-plus"></i> </button>
<button class="btn teal lighten-1  settings-questions-btn" onclick="showHomeState()">Back</i></button>  
   
    `
        changeDisplayState(element);
        M.updateTextFields();

    }

    function editWODState(item){
        element = `
        <form class = form>
        <div class="input-field">
    <input type="text" value ='${item.word}' id ="addWordInput" class="validate active">
    <label for="addQuestionInput">Edit Word of the Day</label>
    </div>

        <div class="input-field">
    <input type="text" value ='${item.definition}' id ="addDefinitionInput" class="validate active">
    <label for="addQuestionInput">Edit Definition</label>
    </div>

    <label for = "nounRadio">
    <input class="with-gap " name ="partsOfSpeechRadioGroup" type="radio" id = "nounRadio" value = 'noun'/>
    <span> Noun </span>
    </label>


    <label for = "adjRadio">
    <input class="with-gap "  name ="partsOfSpeechRadioGroup" type="radio" id = "adjRadio" value = 'adjective' />
    <span>Adjective</span>
    </label>

    <label for = "verbRadio">
    <input class="with-gap " name ="partsOfSpeechRadioGroup" type="radio" id = "verbRadio" value = 'verb'/>
    <span>Verb</span>
    </label>
    
    <label for = "adverbRadio">
    <input class="with-gap " name ="partsOfSpeechRadioGroup" type="radio" id = "adverbRadio" value = 'adverb'/>
    <span>Adverb</span>
    </label>


</form> 
<br>
<button class="btn green settings-questions-btn" onclick = "editWODStateUpdateBtn(${item.id})"> <i class="fas fa-pencil-alt"></i> </button>   
<button class="btn red settings-questions-btn" onclick = "editWODStateDeleteBtn(${item.id})"><i class="fas fa-times"></i> </button>

<button class="btn teal lighten-1  settings-questions-btn" onclick="showHomeState()">Back</button>  

`
        changeDisplayState(element);
        fillWODRadioButton(item.partOfSpeech);

        M.updateTextFields();
    }

    function addNewWODState(){
        element = `
        <form class = "form">

        <div class="input-field">
        <input type="text" placeholder = 'New Word' id ="addWordInput" class="validate active">
        <label for="addQuestionInput">Edit Word of the Day</label>
        </div>
    
            <div class="input-field">
        <input type="text" placeholder ='Word Definition' id ="addDefinitionInput" class="validate active">
        <label for="addQuestionInput">Edit Definition</label>
        </div>
       
        <label for = "nounRadio">
        <input class="with-gap " name ="partsOfSpeechRadioGroup" type="radio" id = "nounRadio" value = 'noun'/>
        <span> Noun </span>
        </label>
    
        <label for = "adjRadio">
        <input class="with-gap "  name ="partsOfSpeechRadioGroup" type="radio" id = "adjRadio" value = 'adjective' />
        <span>Adjective</span>
        </label>

        <label for = "verbRadio">
        <input class="with-gap " name ="partsOfSpeechRadioGroup" type="radio" id = "verbRadio" value = 'verb'/>
        <span>Verb</span>
        </label>
        
        <label for = "adverbRadio">
        <input class="with-gap " name ="partsOfSpeechRadioGroup" type="radio" id = "adverbRadio" value = 'adverb'/>
        <span>Adverb</span>
        </label>
    
    
    </form> 
    <br>
    <button class="btn blue settings-questions-btn" onclick = "addNewWord()"> <i class="fas fa-plus"></i></button>   
    
    <button class="btn teal lighten-1  settings-questions-btn" onclick="showHomeState()">Back</button>  
        `
            changeDisplayState(element);
            M.updateTextFields();
    
    }



    
    function showRulesState(){

        element =
        `
        <h4>How to Play</h4>

        <p><strong>Goal:</strong> Practice impromptu speaking by responding to random prompts.</p>

        <ul class="browser-default">
            <li><strong>Press Play</strong> - You'll get a random question and a Word of the Day</li>
            <li><strong>6-second countdown</strong> - Prepare your thoughts</li>
            <li><strong>Speak for 60-120 seconds</strong> to qualify</li>
            <li>Try to incorporate the Word of the Day in your response!</li>
        </ul>

        <h5>Timer Colors</h5>
        <ul class="browser-default">
            <li><span style="color:#81c784">Green (60s)</span> - You've qualified!</li>
            <li><span style="color:#fff176">Yellow (75s)</span> - Approaching limit</li>
            <li><span style="color:#e57373">Red (90s)</span> - 30 seconds left, wrap up!</li>
            <li><span style="color:#bdbdbd">Grey (120s)</span> - Time's up</li>
        </ul>

        <h5>Voice Recording & AI Analysis</h5>
        <p>Recording starts automatically when you begin speaking. After you finish, your speech will be transcribed and analyzed for:</p>
        <ul class="browser-default">
            <li>Speaking pace (words per minute)</li>
            <li>Filler words (um, uh, like, etc.)</li>
            <li>Structure & clarity</li>
            <li>Topic relevance</li>
            <li>Personalized improvement tips</li>
        </ul>

        <p><em>Note: AI analysis requires an OpenAI API key. Set it in Settings > API Key.</em></p>

        <button class = "btn"  onclick ="showHomeState()">Close</button>

        `
        changeDisplayState(element);
    }

    function showHomeState(){
        element = 'Table Topics'

        changeDisplayState(element)
    }