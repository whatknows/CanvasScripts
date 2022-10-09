/*
createStudentEvaluationFrom.js

For use in Google App Script environment: https://script.google.com/

This script will:
- read a Google Sheet with student and group names
- create a Google Form with sections for each group and appropriate student names

This is not the world's cleanest code, but it works.
*/


/*
UTILITY FUNCTIONS 
*/

function getMessages() {
    msg = {}
    msg.workload = `  
OUTSTANDING: 
Did a full share of the work--or more; knows what needs to be done and does it; volunteers to help others.

PROFICIENT: 
Did an equal share of the work; does work when asked; works hard most of the time.

BASIC: 
Did almost as much work as others; seldom asks for help.

UNACCEPTABLE: 
Did less work than others; Doesn't get caught up after absence;  doesn't ask for help.`

    msg.discussion = `
OUTSTANDING:
Provided many good ideas for the project development; inspires others; clearly communicated desires, ideas, personal needs and feelings.

PROFICIENT:
Participated in discussions; shared feelings and thoughts.

BASIC:
Listened mainly; on some occasions, made suggestions.

UNACCEPTABLE:
Seemed bored with conversations about the project; rarely spoke up and ideas were off the mark.`

    msg.deadlines = `
OUTSTANDING: 
Completed assigned work ahead of time. 

PROFICIENT: 
Completed assigned work on time. 

BASIC: 
Needed some reminding, work was late but it didn't impact grade. 

UNACCEPTABLE: 
Needed much reminding, Work was late and it did impact quality or grade.`

    msg.attendance = `
OUTSTANDING: 
Showed up for meetings punctually, sometimes ahead of time.

PROFICIENT: 
Showed up for meetings on time.  

BASIC: 
Showed up late but it wasn’t a big problem for completing work. 

UNACCEPTABLE: 
No show or extremely late.  Feeble or no excuse offered. `

    msg.providingFeedback = `
OUTSTANDING: 
Habitually provides constructive, clear, and respectful feedback.

PROFICIENT: 
Gave positive and respectful feedback.

BASIC: 
Provided some feedback. Sometimes hurt feelings of others with feedback or made irrelevant comments.

UNACCEPTABLE: 
Was openly rude when giving feedback.`

    msg.gettingFeedback = `
OUTSTANDING: 
Graciously accepted feedback.

PROFICIENT: 
Accepted feedback.

BASIC: 
Reluctantly accepted feedback.

UNACCEPTABLE: 
Refused to listen to feedback. Became defensive.`

    msg.confirmationMessage = "Thank you for completing your peer evaluation.\n\n ⚠️ Please return to Canvas and complete the peer evaluation quiz.\n\nThe password is: "

    return msg;
}

function getGridColumns() {
    return ['Outstanding', 'Proficient', 'Basic', 'Unacceptable']
}

const unique = (value, index, self) => {
    return self.indexOf(value) === index
}

function loadStudentGroupsFromSheet() {
    const spreadsheetId = 'SHEET ID HERE';
    const rangeName = 'A2:B'; // It is expected that the CSV will have headers. Col 1 is the group name, Col 2 is the student name.
    try {
        // Get the values from the spreadsheet using spreadsheetId and range.
        const values = Sheets.Spreadsheets.Values.get(spreadsheetId, rangeName).values;
        //  Print the values from spreadsheet if values are available.
        if (!values) {
            Logger.log('No data found.');
            return;
        }
        // Logger.log('Group, Name:');
        results = []
        for (const row in values) {
            results.push([values[row][0], values[row][1]])
        }
        return results;
    } catch (err) {
        // TODO (developer) - Handle Values.get() exception from Sheet API
        Logger.log(err.message);
    }
}

function getGroupNames(students) {
    groups = [];
    students.forEach(x => groups.push(x[0]));
    // console.log(groups);
    // groups = new Set(groups)
    // console.log(groups);
    groups = groups.filter(unique);
    // console.log(groups);
    return groups;
}

function getStudentNamesByGroup(students, groupName) {
    studentNames = []
    for (i = 0; s = students[i]; i++) {
        // Logger.log(s[1]);
        // Logger.log(groupName);
        if (s[0] == groupName) {
            studentNames.push(s[1]);
        }
    }
    return studentNames;
}

function deleteFormElements(form) {
    var items = form.getItems();
    for (var i = 0; i < items.length; i++) {
        form.deleteItem(0); // This is a weird peice of code. Just trust it. (The tl;dr is that the form API keeps reindexing, so you always want to delete the first one.)
    }
}

function main() {
    var formUrl = "https://docs.google.com/forms/d/1JTrk361d2J3WwG1F19S5QF4F4OvwIvLSbQ8jTZUwl8E/edit?usp=drive_fs"
    form = FormApp.openByUrl(formUrl);
    Logger.log('Editor URL: ' + form.getEditUrl());
    deleteFormElements(form);

    students = loadStudentGroupsFromSheet();
    groups = getGroupNames(students);
    // Logger.log(groups);

    buildForm(form, students);
    Logger.log('Published URL: ' + form.getPublishedUrl());
    // Logger.log(form)
}

function buildForm(form, students) {
    formTitle = "Interview Peer Evaluation"
    // var form = FormApp.create(formTitle); 
    form.setTitle(formTitle);

    form.setConfirmationMessage(getMessages().confirmationMessage + "Braun")

    groups = getGroupNames(students);

    groupObjs = []
    for (i = 0; group = groups[i]; i++) {
        g = {};
        g.name = group;
        g.students = getStudentNamesByGroup(students, g.name);
        groupObjs.push(g);
    }

    // What group are you in?
    var groupSelect = form.addListItem()
        .setTitle('What group are you in?')
        .setRequired(true);

    // Create all of the group sections (while also getting the choices for groupSelect)
    groupSectionChoices = []
    for (var i = 0; i < groupObjs.length; i++) {
        r = buildGroupPage(form, groupObjs[i], groupSelect);
        groupSectionChoices.push(r);
    }

    // Integration
    // Here we add the choices to the group selection form item, now that we have the right sections.
    groupSelect.setChoices(groupSectionChoices);

}

function buildGroupPage(form, group, select) {

    Logger.log("Creating section for " + group.name);
    // Create Section
    var groupSection = form.addPageBreakItem()
        .setTitle(group.name)
        .setGoToPage(FormApp.PageNavigationType.SUBMIT);

    // Add Help Text
    groupSection.setHelpText(`For the following team members, evaluate their performance this week in your group project.\n\nTeam members: ` + group.students.join(', ') + '\n\n ⚠️ If your name does not appear above, please make sure you have selected the correct group. If you have, contact your TA or instructor immediately.')

    var studentSelect = form.addListItem()
        .setTitle('What is your name?')
    studentSelect.setChoiceValues(group.students)
    studentSelect.setRequired(true)

    // Workload
    evalTitle = "Workload"
    section = form.addSectionHeaderItem()
    section.setTitle(evalTitle)
        .setHelpText(getMessages().workload)

    item = form.addGridItem()
    item.setTitle(evalTitle)
        .setRows(group.students)
        .setColumns(getGridColumns())
        .setRequired(true)

    // Discussion
    evalTitle = "Participated in Discussions"
    section = form.addSectionHeaderItem()
    section.setTitle(evalTitle)
        .setHelpText(getMessages().discussion)

    item = form.addGridItem()
    item.setTitle(evalTitle)
        .setRows(group.students)
        .setColumns(getGridColumns())
        .setRequired(true)

    // Deadlines
    evalTitle = "Meeting Deadlines"
    section = form.addSectionHeaderItem()
    section.setTitle(evalTitle)
        .setHelpText(getMessages().deadlines)

    item = form.addGridItem()
    item.setTitle(evalTitle)
        .setRows(group.students)
        .setColumns(getGridColumns())
        .setRequired(true)

    // Attend
    evalTitle = "Showing up for Meetings and Worktime"
    section = form.addSectionHeaderItem()
    section.setTitle(evalTitle)
        .setHelpText(getMessages().attendance)

    item = form.addGridItem()
    item.setTitle(evalTitle)
        .setRows(group.students)
        .setColumns(getGridColumns())
        .setRequired(true)

    // Providing Feedback
    evalTitle = "Providing Feedback"
    section = form.addSectionHeaderItem()
    section.setTitle(evalTitle)
        .setHelpText(getMessages().providingFeedback)

    item = form.addGridItem()
    item.setTitle(evalTitle)
        .setRows(group.students)
        .setColumns(getGridColumns())
        .setRequired(true)

    // Providing Feedback
    evalTitle = "Receiving Feedback"
    section = form.addSectionHeaderItem()
    section.setTitle(evalTitle)
        .setHelpText(getMessages().gettingFeedback)

    item = form.addGridItem()
    item.setTitle(evalTitle)
        .setRows(group.students)
        .setColumns(getGridColumns())
        .setRequired(true)

    // Additional comments?
    text = "Any comments you'd like to make (anonymously)?"
    var item = form.addTextItem()
    item.setTitle(text)
    item.setRequired(false)

    return select.createChoice(group.name, groupSection);
}
