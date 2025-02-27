import {test, expect} from '@playwright/test';
import chatConstants from '../utils/chatConstants';
import { readFileSync } from 'fs';
import translate from 'translate';
import { franc } from 'franc';
import stringSimilarity from 'string-similarity';


let data='tests/chatapp-data.json';

const dataFile = readFileSync(data);
var dataFileObj= JSON.parse(dataFile);

let sharedPage; // This will hold the sharedPage instance across tests
let sharedContext; // This will hold the context instance

test.describe.serial("Chat App test", async ()=>{
    test.beforeAll(async function({browser}){

        sharedContext = await browser.newContext(); // Create a shared context
        sharedPage = await sharedContext.newPage(); // Create a shared page

        await sharedPage.goto(chatConstants.TEST_LOGIN_URL);
    
        await sharedPage.locator('#username').click();
        await sharedPage.locator('#username').fill(dataFileObj.org1ScratchUsername);
        await sharedPage.locator('#password').click();
        await sharedPage.locator('#password').fill(dataFileObj.org1ScratchPassword);
        await sharedPage.locator('#Login').click();
    
    
        // await sharedPage.waitForLoadState('networkidle'); 
        //THIS WAITS FOR THE STATE TO BE COMPLETELY LOAD. THEREFORE WE HAVE HANDELED THE TWO LOADS BY MAKING 2 STATEMENTS.
        await sharedPage.waitForEvent('load'); //First Load
        await sharedPage.waitForEvent('load'); //Second Load
    
    
        // await shared.waitForTimeout(4000);
        await sharedPage.locator('.slds-icon-waffle').waitFor({state:'visible'});
        await sharedPage.locator('.slds-icon-waffle').click();
    
        await sharedPage.getByPlaceholder("Search apps and items...").waitFor({state:'visible'});
        await sharedPage.getByPlaceholder("Search apps and items...").click();
    
        await sharedPage.getByPlaceholder("Search apps and items...").fill("Service");
        await sharedPage.getByRole("option", {name:'Service Console Pre-configured'}).waitFor({state:'visible'});
        await sharedPage.getByRole("option", {name:'Service Console Pre-configured'}).click();
        expect(chatConstants.REP_CHAT_PAGE).toBeTruthy();
    
        await sharedPage.waitForEvent('load');
    
    })
    test("Basic Test", async function({}){
        await sharedPage.locator("//button[.//span[text()='Omni-Channel']]").click();
        await sharedPage.locator("//div[contains(@class, 'headerLink')]//h2[text()='Omni-Channel']").waitFor({state:'visible'});
        await sharedPage.locator("//button[.//span[text()='Omni-Channel (Offline)']]").waitFor({state:'visible'});
        await sharedPage.getByRole("button", {name:"Change your Omni-Channel status"}).waitFor({state:"visible"});
        await sharedPage.getByRole("button", {name:"Change your Omni-Channel status"}).click();
        await sharedPage.locator(".menu-item-container").waitFor({state:'visible'});
        await sharedPage.getByRole("menuitem", {name:"Online"}).waitFor({state:"visible"});
        await sharedPage.getByRole("menuitem", {name:"Online"}).click();
        // await sharedPage.locator('.worklist').waitFor({state:"visible"});

        //ACCEPTING THE REQUEST
        await sharedPage.getByRole("button", {name:'Accept'}).first().click();
        expect(chatConstants.CHAT_OPEN_URL).toBeTruthy();

        //DECLINING THE REQUEST 
        // await sharedPage.getByRole("button", {name:'Decline'}).nth(1).click();

        //Omni-channel ko offline karna ab:
        // await sharedPage.getByRole("button", {name:"Change your Omni-Channel status"}).click();
        // await sharedPage.locator(".menu-item-container").waitFor({state:'visible'});
        // await sharedPage.getByRole("menuitem", {name:"Offline"}).waitFor({state:"visible"});
        // await sharedPage.getByRole("menuitem", {name:"Offline"}).click();
        await sharedPage.getByRole("button", {name:"Minimize"}).click();
        

        /*
        PREREQUISITES FOR TEST THE TRANSLATION OF THE CHATS:
            FIRSTLY THE USER SHPULD BE LOGGED-IN THE SALESFORCE, THE SERVICE CONSOLE APP SHOULD BE OPENED.
            SECONDLY THE OMNI CHANNEL SHOULD BE TURNED ON(AS ONLY AFTER THAT THE USER COULD GET THE REQUESTS)
            ONE REQUEST SHOULD BE ACCEPTED SO THAT THE USE COULD WRITE ANY MESSAGE TO ANYONE AND PERFORM THE TRANSALTION
        */ 
    
        expect(chatConstants.CHAT_URL).toBeTruthy();
        await sharedPage.waitForTimeout(2000); 
        await sharedPage.getByRole('textbox', { name: 'Reply to message' }).hover();
        await sharedPage.getByRole('textbox', { name: 'Reply to message' }).waitFor({state:"visible"});
        await sharedPage.getByRole('textbox', { name: 'Reply to message' }).click();

        const originalTxt=dataFileObj.msgData;


        await sharedPage.getByRole('textbox', { name: 'Reply to message' }).fill(originalTxt);
        await sharedPage.getByRole('button', { name: 'Send' }).click();
        const msgTest= await sharedPage.locator(".slds-chat-message__text_outbound").last().textContent();
        console.log(msgTest);


        await sharedPage.waitForTimeout(1000); 
        await sharedPage.getByRole('tab', { name: 'Multilingual' }).click();
        // await sharedPage.locator('label.slds-checkbox_toggle').click();
        await sharedPage.locator('label.slds-checkbox_toggle').filter({hasText: 'Auto Translation'}).click();

        // await sharedPage.locator('#brandBand_3 lightning-primitive-input-toggle label').click();


        const transaltedMsgTest= await sharedPage.locator(".slds-chat-message__text.slds-chat-message__text_outbound-agent.message_outbound_color").last().textContent();
        console.log("The App's Translation is: "+transaltedMsgTest);

        translate.engine="google";
        const targetLanguage="el";

        //Here the language code is given in which language we want to translate the text and after that it transalte the text/
        const expectedTranslation= await translate(originalTxt, targetLanguage);
        console.log("Expected Translation is:" + expectedTranslation);

        //Here it is comparing the translate(API)'s translation and the translation done by the chat app and gives us the similarity score.
        const similarityScore= stringSimilarity.compareTwoStrings(
            transaltedMsgTest.toLowerCase(),
            expectedTranslation.toLowerCase()
        );
        console.log("Similarity Score:"+ similarityScore);

        //Here we are testing the similarity score to be more than 85%
        expect(similarityScore).toBeGreaterThanOrEqual(0.85);


        await sharedPage.getByRole('button', { name: 'Greek' }).click();
        await sharedPage.getByTitle("Spanish").waitFor({state:"visible"});
        await sharedPage.getByTitle("Spanish").click();
        const transaltedMsgTestTwo= await sharedPage.locator(".slds-chat-message__text.slds-chat-message__text_outbound-agent.message_outbound_color").last().textContent();
        console.log(transaltedMsgTestTwo);


        
        const updateTargetLanguage= "es";
        const updatedExpectLang= await translate(originalTxt, updateTargetLanguage );
        console.log("Updated Translation is:"+ updatedExpectLang);


    
        const updatedSimilarityScore= stringSimilarity.compareTwoStrings(
            transaltedMsgTestTwo.toLowerCase(),
            updatedExpectLang.toLowerCase()
        );
        console.log("After Lang Update Similarity Score:"+ updatedSimilarityScore);

        
        expect(updatedSimilarityScore).toBeGreaterThanOrEqual(0.85);
    })

    test("Quick text test on Multilingual Page", async function({}){
        await sharedPage.getByRole("button", {name:"Quick Text"}).click();
        // await sharedPage.locator(".slds-popover quicktext-picker slds-grid slds-grid_vertical slds-nowrap slds-illustration slds-size_12-of-12 slds-illustration_small").waitFor({state:"visible"});
        await sharedPage.getByRole("button", {name:"Greetings msg in spanish"}).click();
        const quickTextMsg= await sharedPage.locator('.slds-size_1-of-1').nth(3).textContent();
        console.log("The quick message contains: "+ quickTextMsg);

        

        await sharedPage.getByRole("button",{name:"Insert"}).click();
        // const textBoxContain=  await sharedPage.getByRole('textbox', { name: 'Reply to message' }).textContent();
        // console.log("The reply text box contains the quick text: "+ textBoxContain);
        // expect(textBoxContain).toMatch(quickTextMsg);
        await sharedPage.getByRole('button', { name: 'Send' }).click();
        await sharedPage.waitForTimeout(1000);
        const textBoxContain= await sharedPage.locator(".slds-chat-message__text.slds-chat-message__text_outbound-agent.message_outbound_color").last().textContent();
        console.log("The quick text message contains: " +textBoxContain);
    })

    test("Quick text test on Conversation Page", async function({}){
        await sharedPage.getByRole('tab', { name: 'Conversation' }).click();
        await sharedPage.getByRole("button", {name:"Quick Text"}).click();
        await sharedPage.getByText("Greetings in arabic").click();
        await sharedPage.getByRole('button', { name: 'Insert', exact: true }).click();

        await sharedPage.getByRole('button', { name: 'Send' }).click();
        const textBoxContain= await sharedPage.locator(".slds-chat-message__text.slds-chat-message__text_outbound-agent.message_outbound_color").last().textContent();
        console.log("The quick text message contains: " +textBoxContain);

    })


});

// async function detectLang(text){j 
//     translate.engine="google";
//     const detectedLang= translate.
// }
 



 