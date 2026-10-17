// --- START OF FILE: quiz-script.js (GUHERTÎ Û TÊKÛZ) ---
document.addEventListener('DOMContentLoaded', function () {
    if (!firebase.apps.length) {
        console.error("Firebase nehatiye destpêkirin!");
        return;
    }
    const db = firebase.firestore(); 
    const auth = firebase.auth();
    
    const urlParams = new URLSearchParams(window.location.search);
    const pola = urlParams.get('pola');
    const unitId = urlParams.get('unit');
    const chapterId = urlParams.get('chapter');

    if (!pola || !unitId || !chapterId) {
        document.body.innerHTML = `<h1>کێشە: زانیاریێن پێدڤی کێمن!</h1><a href="pol.html">زڤرین</a>`;
        return;
    }

    const questionsCollection = db.collection(`pola${pola}_cards`).doc(unitId).collection('chapters').doc(chapterId).collection('questions');

    const loadingScreen = document.getElementById('loading-screen');
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    const quizTitle = document.getElementById('quiz-title');
    
    const backToChaptersBtn = document.getElementById('back-to-chapters-btn');
    
    const manageBtn = document.getElementById('manage-btn');
    
    const manageModal = document.getElementById('manage-modal');
    const questionList = document.getElementById('question-list');
    const closeManageModalBtn = document.getElementById('close-manage-modal-btn');
    
    const addNewQuestionBtn = document.getElementById('add-new-question-btn');
    const questionModal = document.getElementById('question-modal');
    const modalTitle = document.getElementById('modal-title');
    const questionForm = document.getElementById('question-form');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    
    const bulkPasteBtn = document.getElementById('bulk-paste-btn');
    const bulkPasteModal = document.getElementById('bulk-paste-modal');
    const pasteArea = document.getElementById('paste-area');
    const uploadPastedBtn = document.getElementById('upload-pasted-btn');
    const pasteCancelBtn = document.getElementById('paste-cancel-btn');
    const uploadLog = document.getElementById('upload-log');

    let quizData = [];
    let shuffledQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    backToChaptersBtn.href = `quiz-chapters.html?pola=${pola}&unit=${unitId}`;

    const SUPER_ADMIN_EMAIL = "hussein.zebary.chemistry96@gmail.com";

    async function checkIsAdmin(user) {
        if (!user) return false;
        if (user.email && user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            return userDoc.exists && userDoc.data().isAdmin === true;
        } catch (error) {
            console.error("Kêşe di piştrastkirina rola admin da:", error);
            return false;
        }
    }

    auth.onAuthStateChanged(async (user) => {
        const isAdmin = await checkIsAdmin(user);
        document.body.classList.toggle('admin-mode', isAdmin);
    });

    function loadInitialData() {
        showScreen('loading-screen');
        const chapterDocRef = db.collection(`pola${pola}_cards`).doc(unitId).collection('chapters').doc(chapterId);
        
        chapterDocRef.get().then(chapterDoc => {
            if (chapterDoc.exists) {
                quizTitle.innerHTML = `<i class="fas fa-flask-vial"></i> ${chapterDoc.data().title}`;
            }
        }).catch(error => {
            console.error("Error loading chapter title: ", error);
            quizTitle.innerHTML = `<i class="fas fa-flask-vial"></i> تاقیکرن`;
        });
        
        questionsCollection.onSnapshot(snapshot => {
            quizData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (document.getElementById('loading-screen').classList.contains('active')) {
                showScreen('start-screen');
            }
        }, error => {
            console.error("Error loading questions: ", error);
            loadingScreen.innerHTML = `<h1>کێشە د بارکرنا پسیاران دا!</h1>`;
        });
    }

    function startQuiz() {
        if (quizData.length === 0) {
            alert('هیچ پسیارەک بۆ ڤێ تاقیکرنێ نینە!');
            return;
        }
        currentQuestionIndex = 0;
        score = 0;
        const scoreEl = document.getElementById('score');
        scoreEl.innerHTML = `<i class="fas fa-star"></i> 0`;
        shuffledQuestions = shuffleArray(quizData);
        showScreen('quiz-screen');
        showNextQuestion();
    }

    function showNextQuestion() {
        resetState();
        if (currentQuestionIndex < shuffledQuestions.length) {
            showQuestion(shuffledQuestions[currentQuestionIndex]);
        } else {
            showResult();
        }
    }

    function showQuestion(question) {
        document.getElementById('question-number').innerText = `پسیارا ${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
        document.getElementById('question-text').innerText = question.question;
        
        const optionsContainer = document.getElementById('options-container');
        const shuffledOptions = shuffleArray(question.options);
        shuffledOptions.forEach(optionText => {
            const button = document.createElement('button');
            button.innerText = optionText;
            button.classList.add('option');
            button.addEventListener('click', selectAnswer);
            optionsContainer.appendChild(button);
        });
    }

    function resetState() {
        document.getElementById('next-btn').classList.add('hide');
        const optionsContainer = document.getElementById('options-container');
        while (optionsContainer.firstChild) {
            optionsContainer.removeChild(optionsContainer.firstChild);
        }
    }

    function selectAnswer(e) {
        const selectedBtn = e.target;
        const correctAnwer = shuffledQuestions[currentQuestionIndex].answer;
        if (selectedBtn.innerText === correctAnwer) {
            selectedBtn.classList.add('correct');
            score++;
            document.getElementById('score').innerHTML = `<i class="fas fa-star"></i> ${score}`;
        } else {
            selectedBtn.classList.add('wrong');
        }
        
        const optionsContainer = document.getElementById('options-container');
        Array.from(optionsContainer.children).forEach(button => {
            if (button.innerText === correctAnwer) {
                button.classList.add('correct');
            }
            button.disabled = true;
        });
        document.getElementById('next-btn').classList.remove('hide');
    }

    function showResult() {
        showScreen('result-screen');
        const scorePercent = quizData.length > 0 ? Math.round((score / quizData.length) * 100) : 0;
        document.getElementById('final-score').innerText = `${scorePercent}%`;
        
        const feedbackTextEl = document.getElementById('feedback-text');
        if (scorePercent >= 80) {
            feedbackTextEl.innerText = 'کارەکێ نایابە!';
        } else if (scorePercent >= 50) {
            feedbackTextEl.innerText = 'باشە! دشێی باشتر بی.';
        } else {
            feedbackTextEl.innerText = 'پێدڤیە پتر بخوینی.';
        }
    }
    
    function renderManageList() {
        questionList.innerHTML = '';
        const sortedData = [...quizData].sort((a, b) => (a.question || "").localeCompare(b.question || ""));
        sortedData.forEach((q) => {
            const item = document.createElement('div');
            item.className = 'question-manage-item';
            item.innerHTML = `<p>${q.question}</p><div class="actions"><i class="fas fa-edit edit-icon" data-id="${q.id}"></i><i class="fas fa-trash delete-icon" data-id="${q.id}"></i></div>`;
            questionList.appendChild(item);
        });
    }
    
    function showQuestionModal(id = null) {
        questionForm.reset();
        document.getElementById('question-id').value = id || '';
        if (id) {
            modalTitle.innerText = 'گوهورینا پسیارێ';
            const q = quizData.find(q => q.id === id);
            if (q) {
                document.getElementById('modal-question-text').value = q.question;
                const optionInputs = document.querySelectorAll('.option-input');
                const radioButtons = document.querySelectorAll('input[name="correct-answer"]');
                q.options.forEach((opt, i) => {
                    if(optionInputs[i]) optionInputs[i].value = opt;
                });
                const correctIndex = q.options.indexOf(q.answer);
                if (correctIndex > -1 && radioButtons[correctIndex]) {
                    radioButtons[correctIndex].checked = true;
                }
            }
        } else {
            modalTitle.innerText = 'زێدەکرنا پسیارەکا نوو';
        }
        questionModal.style.display = 'flex';
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    document.getElementById('start-btn').addEventListener('click', startQuiz);
    document.getElementById('restart-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('next-btn').addEventListener('click', () => {
        currentQuestionIndex++;
        showNextQuestion();
    });

    manageBtn.addEventListener('click', () => {
        if(!document.body.classList.contains('admin-mode')) return;
        renderManageList();
        manageModal.style.display = 'flex';
    });

    closeManageModalBtn.addEventListener('click', () => manageModal.style.display = 'none');
    
    addNewQuestionBtn.addEventListener('click', () => {
        manageModal.style.display = 'none';
        showQuestionModal();
    });

    modalCancelBtn.addEventListener('click', () => {
        questionModal.style.display = 'none';
        if (document.body.classList.contains('admin-mode')) {
            manageModal.style.display = 'flex';
        }
    });

    bulkPasteBtn.addEventListener('click', () => {
        manageModal.style.display = 'none';
        pasteArea.value = '';
        uploadLog.innerHTML = '';
        uploadLog.style.display = 'none';
        bulkPasteModal.style.display = 'flex';
    });

    pasteCancelBtn.addEventListener('click', () => {
        bulkPasteModal.style.display = 'none';
        if (document.body.classList.contains('admin-mode')) {
            manageModal.style.display = 'flex';
        }
    });
    
    questionList.addEventListener('click', async (e) => {
        if(!document.body.classList.contains('admin-mode')) return;
        const id = e.target.dataset.id;
        if (!id) return;
        if (e.target.classList.contains('edit-icon')) {
            manageModal.style.display = 'none';
            showQuestionModal(id);
        }
        if (e.target.classList.contains('delete-icon')) {
            if (confirm('تو پشتراستی دڤێی ڤێ پسیارێ ژێببەی؟')) {
                try {
                    await questionsCollection.doc(id).delete();
                } catch (error) {
                    alert('کێشە د ژێبرنێ دا!');
                }
            }
        }
    });

    questionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!document.body.classList.contains('admin-mode')) return;

        const id = document.getElementById('question-id').value;
        const options = Array.from(document.querySelectorAll('.option-input')).map(input => input.value.trim());
        const correctRadio = document.querySelector('input[name="correct-answer"]:checked');
        
        if (!correctRadio || options.some(opt => opt === '')) {
            return alert('تکایە هەمی خانەیان پر بکە و بەرسڤا دروست دیاربکە!');
        }

        const questionData = {
            question: document.getElementById('modal-question-text').value.trim(),
            options: options,
            answer: options[parseInt(correctRadio.value)],
            color: document.getElementById('modal-question-color').value
        };

        try {
            if (id) {
                await questionsCollection.doc(id).update(questionData);
            } else {
                await questionsCollection.add(questionData);
            }
            questionModal.style.display = 'none';
            manageModal.style.display = 'flex';
            renderManageList();
        } catch (error) {
            console.error("Save Error:", error);
            alert('کێشە د پاشکەفتنێ دا!');
        }
    });

    uploadPastedBtn.addEventListener('click', async () => {
        if(!document.body.classList.contains('admin-mode')) return;

        const text = pasteArea.value.trim();
        if (!text) return alert('تکایە پسیاران پەیست بکە!');
        
        uploadLog.style.display = 'block';
        uploadLog.innerHTML = 'دەستپێکر...\n';
        uploadPastedBtn.disabled = true;

        const batch = db.batch();
        const questionBlocks = text.split('➳').filter(block => block.trim() !== '');
        let successCount = 0;
        let totalCount = questionBlocks.length;

        for (const block of questionBlocks) {
            const parts = block.trim().split('✹');
            if (parts.length !== 3) {
                uploadLog.innerHTML += `❌ فۆرمات خەلەتە: "${block.slice(0, 20)}..."\n`;
                continue;
            }
            
            const [questionText, optionsString, answerString] = parts.map(p => p.trim());
            const options = optionsString.split('〇').map(opt => opt.trim()).filter(Boolean);
            
            if (options.length < 2) {
                uploadLog.innerHTML += `❌ هەلبژارتن کێمن: "${questionText}"\n`;
                continue;
            }
            
            if (!answerString.toLowerCase().startsWith('بەرسڤ')) {
                uploadLog.innerHTML += `❌ پەیڤا 'بەرسڤ' نینە: "${questionText}"\n`;
                continue;
            }
            
            const correctAnswer = answerString.replace(/بەرسڤ/i, '').trim();
            
            if (!options.includes(correctAnswer)) {
                uploadLog.innerHTML += `❌ بەرسڤ د هەلبژارتنان دا نینە: "${questionText}"\n`;
                continue;
            }
            
            const newQuestionRef = questionsCollection.doc();
            batch.set(newQuestionRef, { question: questionText, options, answer: correctAnswer, color: 'accent' });
            successCount++;
            uploadLog.innerHTML += `✅ "${questionText.slice(0, 20)}..." ئامادەکر.\n`;
        }
        
        try {
            await batch.commit();
            uploadLog.innerHTML += `\nتەمام بوو! ${successCount} ژ ${totalCount} پسیar b سەرکەفتی هاتنە بارکرن.`;
        } catch (error) {
            uploadLog.innerHTML += `\n❌ کێشەیەکا گشتی د پاشکەفتنێ دا چێبوو! ${error.message}`;
        }
        
        uploadPastedBtn.disabled = false;
    });
    
    loadInitialData();
});
// --- END OF FILE: quiz-script.js ---
