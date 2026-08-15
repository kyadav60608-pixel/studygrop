// ========================================
// SUPABASE CONNECTION
// ========================================

const SUPABASE_URL =
    "https://orkdoabpkjufvdigvwua.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_NNk1pddwAnLMKizeMFtXpw_6O52B_LQ";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ========================================
// PAGE NAVIGATION
// ========================================

const pages =
    document.querySelectorAll(".page");

const navButtons =
    document.querySelectorAll("[data-page]");


function showPage(pageId) {

    pages.forEach(function(page) {
        page.classList.remove("active");
    });

    const page =
        document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }

    const navMenu =
        document.getElementById("navMenu");

    if (navMenu) {
        navMenu.classList.remove("show");
    }
}


navButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            showPage(
                button.getAttribute("data-page")
            );

        }
    );

});


// ========================================
// HOME CARDS
// ========================================

const openPageCards =
    document.querySelectorAll(".open-page");


openPageCards.forEach(function(card) {

    card.addEventListener(
        "click",
        function() {

            showPage(
                card.getAttribute("data-page")
            );

        }
    );

});


// ========================================
// MENU
// ========================================

const menuBtn =
    document.getElementById("menuBtn");

const navMenu =
    document.getElementById("navMenu");


if (menuBtn && navMenu) {

    menuBtn.addEventListener(
        "click",
        function() {

            navMenu.classList.toggle("show");

        }
    );

}


// ========================================
// NAME / WELCOME
// ========================================

const studentName =
    document.getElementById("studentName");

const saveNameBtn =
    document.getElementById("saveNameBtn");

const nameMessage =
    document.getElementById("nameMessage");


function loadSavedName() {

    const savedName =
        localStorage.getItem("studyName");

    if (
        savedName &&
        studentName &&
        nameMessage &&
        saveNameBtn
    ) {

        studentName.value =
            savedName;

        nameMessage.textContent =
            "Welcome, " + savedName + "! 👋";

        studentName.disabled =
            true;

        saveNameBtn.style.display =
            "none";
    }
}


if (saveNameBtn && studentName) {

    saveNameBtn.addEventListener(
        "click",
        function() {

            const name =
                studentName.value.trim();

            if (name === "") {

                if (nameMessage) {
                    nameMessage.textContent =
                        "पहले अपना नाम लिखें।";
                }

                return;
            }

            localStorage.setItem(
                "studyName",
                name
            );

            if (nameMessage) {
                nameMessage.textContent =
                    "Welcome, " + name + "! 👋";
            }

            studentName.disabled =
                true;

            saveNameBtn.style.display =
                "none";

        }
    );

    loadSavedName();

}


// ========================================
// CHAT ELEMENTS
// ========================================

const messageInput =
    document.getElementById("messageInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

const chatMessages =
    document.getElementById("chatMessages");


// ========================================
// SHOW MESSAGES + SEEN SYSTEM
// ========================================

async function displayMessages() {

    if (!chatMessages) {
        return;
    }

    const currentName =
        localStorage.getItem("studyName")
        || "Student";


    // ------------------------------------
    // LOAD MESSAGES
    // ------------------------------------

    const result =
        await supabaseClient
            .from("Text")
            .select("*")
            .order("created_at", {
                ascending: true
            });


    const data =
        result.data;

    const error =
        result.error;


    if (error) {

        console.error(
            "Load messages error:",
            error
        );

        return;
    }


    chatMessages.innerHTML =
        "";


    if (!data || data.length === 0) {

        chatMessages.innerHTML = `
            <div class="message other">
                <strong>StudyConnect</strong>
                <p>
                    Welcome! यहाँ अपना message
                    लिख सकते हो। 👋
                </p>
            </div>
        `;

        return;
    }


    // ------------------------------------
    // MARK OTHER PEOPLE'S MESSAGES SEEN
    // ------------------------------------

    for (const item of data) {

        if (
            item.id &&
            item.name &&
            item.name !== currentName
        ) {

            const seenResult =
                await supabaseClient
                    .from("message_reads")
                    .select("id")
                    .eq(
                        "message_id",
                        String(item.id)
                    )
                    .eq(
                        "viewer_name",
                        currentName
                    )
                    .maybeSingle();


            if (
                !seenResult.data &&
                !seenResult.error
            ) {

                const insertResult =
                    await supabaseClient
                        .from("message_reads")
                        .insert({
                            message_id:
                                String(item.id),

                            viewer_name:
                                currentName
                        });


                if (insertResult.error) {

                    console.error(
                        "Seen save error:",
                        insertResult.error
                    );
                }
            }
        }
    }


    // ------------------------------------
    // LOAD SEEN DATA
    // ------------------------------------

    const readsResult =
        await supabaseClient
            .from("message_reads")
            .select(
                "message_id, viewer_name"
            );


    const reads =
        readsResult.data || [];


    if (readsResult.error) {

        console.error(
            "Seen data error:",
            readsResult.error
        );
    }


    // ------------------------------------
    // DISPLAY EVERY MESSAGE
    // ------------------------------------

    data.forEach(function(item) {

        const messageBox =
            document.createElement("div");


        messageBox.className =
            "message";


        const name =
            item.name || "Student";


        const message =
            item.message || "";


        // --------------------------------
        // FIND WHO SAW THIS MESSAGE
        // --------------------------------

        const seenBy =
            reads
                .filter(function(read) {

                    return String(
                        read.message_id
                    ) === String(item.id);

                })
                .map(function(read) {

                    return read.viewer_name;

                });


        // Remove duplicate names
        const uniqueSeenBy =
            [...new Set(seenBy)];


        // Don't count yourself
        const otherViewers =
            uniqueSeenBy.filter(
                function(viewer) {

                    return viewer !==
                        currentName;

                }
            );


        // --------------------------------
        // MESSAGE STATUS
        // --------------------------------

        let statusHTML =
            "";


        // Only YOUR messages get ticks
        if (name === currentName) {

            if (
                otherViewers.length > 0
            ) {

                // BLUE DOUBLE TICK
                statusHTML = `
                    <span
                        style="
                            color:#2196f3;
                            font-weight:bold;
                            font-size:16px;
                            margin-left:5px;
                        "
                    >
                        ✓✓
                    </span>
                `;

            } else {

                // SENT
                statusHTML = `
                    <span
                        style="
                            color:#777;
                            font-size:16px;
                            margin-left:5px;
                        "
                    >
                        ✓
                    </span>
                `;
            }
        }


        // --------------------------------
        // MESSAGE HTML
        // --------------------------------

        messageBox.innerHTML = `
            <strong>
                ${escapeHTML(name)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

            ${
                name === currentName
                ? `
                    <small>
                        ${statusHTML}
                    </small>
                `
                : ""
            }
        `;


        // --------------------------------
        // CLICK YOUR MESSAGE
        // TO SEE WHO VIEWED IT
        // --------------------------------

        if (
            name === currentName &&
            otherViewers.length > 0
        ) {

            messageBox.style.cursor =
                "pointer";


            messageBox.title =
                "देखें किसने message देखा";


            messageBox.addEventListener(
                "click",
                function() {

                    alert(
                        "इस message को देखा है:\n\n"
                        +
                        otherViewers.join(
                            "\n"
                        )
                    );

                }
            );
        }


        chatMessages.appendChild(
            messageBox
        );

    });


    // ------------------------------------
    // SCROLL TO BOTTOM
    // ------------------------------------

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    if (!messageInput) {
        return;
    }


    const text =
        messageInput.value.trim();


    if (text === "") {
        return;
    }


    const name =
        localStorage.getItem("studyName")
        || "Student";


    const result =
        await supabaseClient
            .from("Text")
            .insert([
                {
                    name: name,
                    message: text
                }
            ]);


    if (result.error) {

        console.error(
            "Send message error:",
            result.error
        );

        alert(
            "Message भेजने में समस्या हुई।"
        );

        return;
    }


    messageInput.value =
        "";


    await displayMessages();
}


// ========================================
// SEND BUTTON
// ========================================

if (sendMessageBtn) {

    sendMessageBtn.addEventListener(
        "click",
        sendMessage
    );

}


// ========================================
// ENTER TO SEND
// ========================================

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ========================================
// GROUPS
// ========================================

const groupInput =
    document.getElementById("groupInput");

const createGroupBtn =
    document.getElementById("createGroupBtn");

const groupList =
    document.getElementById("groupList");


if (createGroupBtn) {

    createGroupBtn.addEventListener(
        "click",
        function() {

            const groupName =
                groupInput.value.trim();


            if (groupName === "") {

                alert(
                    "Group का नाम लिखें।"
                );

                return;
            }


            const group =
                document.createElement("div");


            group.className =
                "group-item";


            group.textContent =
                "👥 " + groupName;


            if (groupList) {

                groupList.appendChild(
                    group
                );
            }


            groupInput.value =
                "";

        }
    );

}


// ========================================
// HOMEWORK
// ========================================

const subjectInput =
    document.getElementById("subjectInput");

const homeworkInput =
    document.getElementById("homeworkInput");

const addHomeworkBtn =
    document.getElementById("addHomeworkBtn");

const homeworkList =
    document.getElementById("homeworkList");


if (addHomeworkBtn) {

    addHomeworkBtn.addEventListener(
        "click",
        function() {

            const subject =
                subjectInput.value.trim();


            const homework =
                homeworkInput.value.trim();


            if (
                subject === "" ||
                homework === ""
            ) {

                alert(
                    "Subject और Homework दोनों लिखें।"
                );

                return;
            }


            const item =
                document.createElement("div");


            item.className =
                "homework-item";


            item.innerHTML = `
                <strong>
                    ${escapeHTML(subject)}
                </strong>

                <p>
                    ${escapeHTML(homework)}
                </p>
            `;


            if (homeworkList) {

                homeworkList.appendChild(
                    item
                );
            }


            subjectInput.value =
                "";

            homeworkInput.value =
                "";

        }
    );

}


// ========================================
// SCHOOL
// ========================================

const schoolInput =
    document.getElementById("schoolInput");

const saveSchoolBtn =
    document.getElementById("saveSchoolBtn");

const schoolList =
    document.getElementById("schoolList");


if (saveSchoolBtn) {

    saveSchoolBtn.addEventListener(
        "click",
        function() {

            const update =
                schoolInput.value.trim();


            if (update === "") {

                alert(
                    "School update लिखें।"
                );

                return;
            }


            const item =
                document.createElement("div");


            item.className =
                "school-item";


            item.textContent =
                update;


            if (schoolList) {

                schoolList.appendChild(
                    item
                );
            }


            schoolInput.value =
                "";

        }
    );

}


// ========================================
// NOTES
// ========================================

const noteInput =
    document.getElementById("noteInput");

const saveNoteBtn =
    document.getElementById("saveNoteBtn");

const notesList =
    document.getElementById("notesList");


if (saveNoteBtn) {

    saveNoteBtn.addEventListener(
        "click",
        function() {

            const note =
                noteInput.value.trim();


            if (note === "") {

                alert(
                    "Note लिखें।"
                );

                return;
            }


            const item =
                document.createElement("div");


            item.className =
                "note-item";


            item.textContent =
                note;


            if (notesList) {

                notesList.appendChild(
                    item
                );
            }


            noteInput.value =
                "";

        }
    );

}


// ========================================
// DARK MODE
// ========================================

const themeBtn =
    document.getElementById("themeBtn");


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        function() {

            document.body.classList.toggle(
                "dark"
            );


            const darkMode =
                document.body.classList.contains(
                    "dark"
                );


            localStorage.setItem(
                "darkMode",
                darkMode
            );

        }
    );

}


if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

}


// ========================================
// RESET APP
// ========================================

const clearDataBtn =
    document.getElementById(
        "clearDataBtn"
    );


if (clearDataBtn) {

    clearDataBtn.addEventListener(
        "click",
        function() {

            const confirmReset =
                confirm(
                    "क्या आप app का local data reset करना चाहते हैं?"
                );


            if (!confirmReset) {
                return;
            }


            localStorage.clear();

            location.reload();

        }
    );

}


// ========================================
// SECURITY
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;
}


// ========================================
// START
// ========================================

displayMessages();




console.log(
    "StudyConnect loaded successfully."
);
const APP_PASSWORD = "123";

const passwordScreen =
    document.getElementById("passwordScreen");

const appPassword =
    document.getElementById("appPassword");

const unlockBtn =
    document.getElementById("unlockBtn");

const passwordError =
    document.getElementById("passwordError");


function unlockApp() {

    const enteredPassword =
        appPassword.value.trim();

    if (enteredPassword === APP_PASSWORD) {

        passwordScreen.style.display =
            "none";

        sessionStorage.setItem(
            "studyUnlocked",
            "true"
        );

    } else {

        passwordError.textContent =
            "गलत password ❌";

        appPassword.value = "";
    }
}


if (unlockBtn) {

    unlockBtn.addEventListener(
        "click",
        unlockApp
    );

}


if (appPassword) {

    appPassword.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {
                unlockApp();
            }

        }
    );

}


if (
    sessionStorage.getItem(
        "studyUnlocked"
    ) === "true"
) {

    passwordScreen.style.display =
        "none";
}