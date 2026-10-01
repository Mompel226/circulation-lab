/* ============================================================
   config.js — the settings Dr Mompel changes.
   ============================================================ */
window.LAB_CONFIG = {

  /* Where a signed-in student's work is sent: the /exec URL of the deployed Apps Script
     web app. The same address as every other lab. Leave it empty and the lab still works;
     the work simply stays in the student's browser. */
  submitUrl: 'https://script.google.com/macros/s/AKfycbzwjMHaa88OL_GzR8wZ2mV6a8rs1CKYahbW5iOTQPyzWzCGIrAZPApGsP2oujK34tRc/exec',

  syllabusTopics: ['9'],   /* the topic this lab teaches: it comes first when the syllabus is opened from the badge */

  /* Signing in, so a student's work can be attributed.

     These labs are public: anyone in the world can use one, and should. But only your own
     students' results should reach your spreadsheet, so work is recorded when the Google
     account that signed in is on your Students tab, and ignored otherwise.

     A Client ID is a name-tag for your app, issued by Google — not a secret, and visible
     in this file on purpose. This page uses it to ask Google for a sign-in; the Apps Script
     uses the SAME id to check the token it gets back was made for your app and not somebody
     else's. The full version is in the Biology Hub README (github.com/Mompel226/igcse-biology-hub),
     under "Step 3 · Switch on sign-in". */
  googleClientId: '749068441640-jgh9s0rbg8ed9hl14mtv6kdhg5jg6ddf.apps.googleusercontent.com',
};
