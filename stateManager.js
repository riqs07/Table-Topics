// State Manager - Controls display states

function changeDisplayState(element) {
    questionDisplay.innerHTML = element;
}

function editQuestionState(item) {
    element = `
        <div class="form-container">
            <h3 class="form-title">Edit Question</h3>

            <div class="input-field">
                <label for="addQuestionInput">Question</label>
                <input type="text" value="${item.question}" id="addQuestionInput">
            </div>

            <div class="input-field">
                <label>Difficulty</label>
                <div class="radio-group">
                    <label>
                        <input name="diffucltyRadioGroup" type="radio" id="easyRadio" value="easy"/>
                        Easy
                    </label>
                    <label>
                        <input name="diffucltyRadioGroup" type="radio" id="medRadio" value="medium"/>
                        Medium
                    </label>
                    <label>
                        <input name="diffucltyRadioGroup" type="radio" id="hardRadio" value="hard"/>
                        Hard
                    </label>
                </div>
            </div>

            <div class="button-row">
                <button class="btn btn-primary" onclick="editQuestionStateUpdateBtn(${item.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save
                </button>
                <button class="btn btn-outline btn-danger" onclick="editQuestionStateDeleteBtn(${item.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Delete
                </button>
                <button class="btn btn-secondary" onclick="showHomeState()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back
                </button>
            </div>
        </div>
    `;

    changeDisplayState(element);
    fillQuestionRadioButton(item.difficulty);
}

function addNewQuestionState() {
    element = `
        <div class="form-container">
            <h3 class="form-title">Add New Question</h3>

            <div class="input-field">
                <label for="addQuestionInput">Question</label>
                <input type="text" placeholder="Enter your question..." id="addQuestionInput">
            </div>

            <div class="input-field">
                <label>Difficulty</label>
                <div class="radio-group">
                    <label>
                        <input name="diffucltyRadioGroup" type="radio" id="easyRadio" value="easy"/>
                        Easy
                    </label>
                    <label>
                        <input name="diffucltyRadioGroup" type="radio" id="medRadio" value="medium" checked/>
                        Medium
                    </label>
                    <label>
                        <input name="diffucltyRadioGroup" type="radio" id="hardRadio" value="hard"/>
                        Hard
                    </label>
                </div>
            </div>

            <div class="button-row">
                <button class="btn btn-primary" onclick="addNewQuestion()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Question
                </button>
                <button class="btn btn-secondary" onclick="showHomeState()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back
                </button>
            </div>
        </div>
    `;
    changeDisplayState(element);
}

function editWODState(item) {
    element = `
        <div class="form-container">
            <h3 class="form-title">Edit Word of the Day</h3>

            <div class="input-field">
                <label for="addWordInput">Word</label>
                <input type="text" value="${item.word}" id="addWordInput">
            </div>

            <div class="input-field">
                <label for="addDefinitionInput">Definition</label>
                <input type="text" value="${item.definition}" id="addDefinitionInput">
            </div>

            <div class="input-field">
                <label>Part of Speech</label>
                <div class="radio-group">
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="nounRadio" value="Noun"/>
                        Noun
                    </label>
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="adjRadio" value="Adjective"/>
                        Adjective
                    </label>
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="verbRadio" value="Verb"/>
                        Verb
                    </label>
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="adverbRadio" value="Adverb"/>
                        Adverb
                    </label>
                </div>
            </div>

            <div class="button-row">
                <button class="btn btn-primary" onclick="editWODStateUpdateBtn(${item.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save
                </button>
                <button class="btn btn-outline btn-danger" onclick="editWODStateDeleteBtn(${item.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Delete
                </button>
                <button class="btn btn-secondary" onclick="showHomeState()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back
                </button>
            </div>
        </div>
    `;
    changeDisplayState(element);
    fillWODRadioButton(item.partOfSpeech);
}

function addNewWODState() {
    element = `
        <div class="form-container">
            <h3 class="form-title">Add Word of the Day</h3>

            <div class="input-field">
                <label for="addWordInput">Word</label>
                <input type="text" placeholder="Enter word..." id="addWordInput">
            </div>

            <div class="input-field">
                <label for="addDefinitionInput">Definition</label>
                <input type="text" placeholder="Enter definition..." id="addDefinitionInput">
            </div>

            <div class="input-field">
                <label>Part of Speech</label>
                <div class="radio-group">
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="nounRadio" value="Noun" checked/>
                        Noun
                    </label>
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="adjRadio" value="Adjective"/>
                        Adjective
                    </label>
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="verbRadio" value="Verb"/>
                        Verb
                    </label>
                    <label>
                        <input name="partsOfSpeechRadioGroup" type="radio" id="adverbRadio" value="Adverb"/>
                        Adverb
                    </label>
                </div>
            </div>

            <div class="button-row">
                <button class="btn btn-primary" onclick="addNewWord()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Word
                </button>
                <button class="btn btn-secondary" onclick="showHomeState()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back
                </button>
            </div>
        </div>
    `;
    changeDisplayState(element);
}

function showRulesState() {
    element = `
        <div class="rules-container">
            <h3 class="form-title">How to Play</h3>

            <p><strong>Goal:</strong> Practice impromptu speaking by responding to random prompts.</p>

            <ul class="browser-default">
                <li><strong>Press Play</strong> - You'll get a random question and a Word of the Day</li>
                <li><strong>6-second countdown</strong> - Prepare your thoughts</li>
                <li><strong>Speak for 60-120 seconds</strong> to qualify</li>
                <li>Try to incorporate the Word of the Day in your response!</li>
            </ul>

            <h4 style="margin-top: 1.5rem; font-size: 1rem;">Timer Colors</h4>
            <ul class="browser-default">
                <li><span class="text-success">Green (60s)</span> - You've qualified!</li>
                <li><span class="text-warning">Yellow (75s)</span> - Approaching limit</li>
                <li><span class="text-danger">Red (90s)</span> - 30 seconds left, wrap up!</li>
                <li><span class="text-muted">Grey (120s)</span> - Time's up</li>
            </ul>

            <h4 style="margin-top: 1.5rem; font-size: 1rem;">Voice Recording & AI Analysis</h4>
            <p>Recording starts automatically when you begin speaking. After you finish, your speech will be transcribed and analyzed for:</p>
            <ul class="browser-default">
                <li>Speaking pace (words per minute)</li>
                <li>Filler words (um, uh, like, etc.)</li>
                <li>Structure & clarity</li>
                <li>Topic relevance</li>
                <li>Personalized improvement tips</li>
            </ul>

            <p class="text-muted" style="font-style: italic; margin-top: 1rem;">
                Note: AI analysis requires an OpenAI API key. Set it in Settings > API Key.
            </p>

            <button class="btn btn-secondary" onclick="showHomeState()" style="margin-top: 1rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Close
            </button>
        </div>
    `;
    changeDisplayState(element);
}

function showHomeState() {
    element = `
        <h1 class="display-title">Ready to Practice?</h1>
        <p class="display-subtitle">Improve your impromptu speaking skills</p>
    `;
    changeDisplayState(element);
}
