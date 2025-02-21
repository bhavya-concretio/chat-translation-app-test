import {test, expect} from '@playwright/test';
import chatConstants from '../utils/chatConstants';
import { readFileSync } from 'fs';
import translate from 'translate';
import { franc } from 'franc';
import stringSimilarity from 'string-similarity';


let data='tests/chatapp-data.json';



test("Omni-Channel Test(Login to omnichannel)", async ({page})=>{

    const dataFile = readFileSync(data);
    var dataFileObj= JSON.parse(dataFile);

    await page.goto(chatConstants.TEST_LOGIN_URL);

    await page.locator('#username').click();
    await page.locator('#username').fill(dataFileObj.scratchUsername);
    await page.locator('#password').click();
    await page.locator('#password').fill(dataFileObj.scratchPassword);
    await page.locator('#Login').click();

    // await page.waitForLoadState('networkidle'); 
    //THIS WAITS FOR THE STATE TO BE COMPLETELY LOAD. THEREFORE WE HAVE HANDELED THE TWO LOADS BY MAKING 2 STATEMENTS.
    await page.waitForEvent('load'); //First Load
    await page.waitForEvent('load'); //Second Load


    // await page.waitForTimeout(4000);



    await page.locator('.slds-icon-waffle').waitFor({state:'visible'});
    await page.locator('.slds-icon-waffle').click();

    await page.getByPlaceholder("Search apps and items...").waitFor({state:'visible'});
    await page.getByPlaceholder("Search apps and items...").click();

    await page.getByPlaceholder("Search apps and items...").fill("Service");
    await page.getByRole("option", {name:'Service Console Pre-configured'}).waitFor({state:'visible'});
    await page.getByRole("option", {name:'Service Console Pre-configured'}).click();
    expect(chatConstants.REP_CHAT_PAGE).toBeTruthy();

    await page.waitForEvent('load');

    await page.locator("//button[.//span[text()='Omni-Channel']]").click();
    await page.locator("//div[contains(@class, 'headerLink')]//h2[text()='Omni-Channel']").waitFor({state:'visible'});
    await page.locator("//button[.//span[text()='Omni-Channel (Offline)']]").waitFor({state:'visible'});
    await page.getByRole("button", {name:"Change your Omni-Channel status"}).waitFor({state:"visible"});
    await page.getByRole("button", {name:"Change your Omni-Channel status"}).click();
    await page.locator(".menu-item-container").waitFor({state:'visible'});
    await page.getByRole("menuitem", {name:"Online"}).waitFor({state:"visible"});
    await page.getByRole("menuitem", {name:"Online"}).click();
    // await page.locator('.worklist').waitFor({state:"visible"});

    //ACCEPTING THE REQUEST
    await page.getByRole("button", {name:'Accept'}).first().click();
    expect(chatConstants.CHAT_OPEN_URL).toBeTruthy();

    //DECLINING THE REQUEST 
    // await page.getByRole("button", {name:'Decline'}).nth(1).click();

    //Omni-channel ko offline karna ab:
    // await page.getByRole("button", {name:"Change your Omni-Channel status"}).click();
    // await page.locator(".menu-item-container").waitFor({state:'visible'});
    // await page.getByRole("menuitem", {name:"Offline"}).waitFor({state:"visible"});
    // await page.getByRole("menuitem", {name:"Offline"}).click();
    await page.getByRole("button", {name:"Minimize"}).click();
    

    /*
    PREREQUISITES FOR TEST THE TRANSLATION OF THE CHATS:
        FIRSTLY THE USER SHPULD BE LOGGED-IN THE SALESFORCE, THE SERVICE CONSOLE APP SHOULD BE OPENED.
        SECONDLY THE OMNI CHANNEL SHOULD BE TURNED ON(AS ONLY AFTER THAT THE USER COULD GET THE REQUESTS)
        ONE REQUEST SHOULD BE ACCEPTED SO THAT THE USE COULD WRITE ANY MESSAGE TO ANYONE AND PERFORM THE TRANSALTION
    */ 
   
    expect(chatConstants.CHAT_URL).toBeTruthy();
    await page.waitForTimeout(4000); 
    await page.getByRole('textbox', { name: 'Reply to message' }).hover();
    await page.getByRole('textbox', { name: 'Reply to message' }).waitFor({state:"visible"});
    await page.getByRole('textbox', { name: 'Reply to message' }).click();

    const originalTxt=dataFileObj.msgData;


    await page.getByRole('textbox', { name: 'Reply to message' }).fill(originalTxt);
    await page.getByRole('button', { name: 'Send' }).click();
    const msgTest= await page.locator(".slds-chat-message__text_outbound").last().textContent();
    console.log(msgTest);


    await page.waitForTimeout(4000); 
    await page.getByRole('tab', { name: 'Multilingual' }).click();
    // await page.locator('label.slds-checkbox_toggle').click();
    await page.locator('label.slds-checkbox_toggle').filter({ hasText: 'Auto Translation' }).click();

    // await page.locator('#brandBand_3 lightning-primitive-input-toggle label').click();


    const transaltedMsgTest= await page.locator(".slds-chat-message__text.slds-chat-message__text_outbound-agent.message_outbound_color").last().textContent();
    console.log(transaltedMsgTest);

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


    await page.getByRole('button', { name: 'Greek' }).click();
    await page.getByTitle("Spanish").waitFor({state:"visible"});
    await page.getByTitle("Spanish").click();
    const transaltedMsgTestTwo= await page.locator(".slds-chat-message__text.slds-chat-message__text_outbound-agent.message_outbound_color").last().textContent();
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


});

// async function detectLang(text){
//     translate.engine="google";
//     const detectedLang= translate.
// }
 



 