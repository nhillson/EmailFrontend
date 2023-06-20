document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Send POST method to API when compose-submit pressed
  document.querySelector('#compose-form').addEventListener('submit', function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then (response => response.json())
    .then(result => {
      if (result.error) {
        alert(`${result.error}`);
      } else{
        document.querySelector('#emails-view').style.display = 'block';
        document.querySelector('#compose-view').style.display = 'none';
      }
    });
  });
}

function replyto(contents) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#compose-recipients').value = contents.sender;
  document.querySelector('#compose-recipients').disabled = true;
  if (contents.subject.startsWith('Re: ')) {
    document.querySelector('#compose-subject').value = contents.subject;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${contents.subject}`;
  }
  document.querySelector('#compose-subject').disabled = true;
  document.querySelector('#compose-body').value = `\n\nOn ${contents.timestamp} ${contents.sender} wrote:\n${contents.body}`;
  document.querySelector('#compose-form').addEventListener('submit', function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then (response => response.json())
    .then(result => {
      if (result.error) {
        alert(`${result.error}`);
      } else{
        load_mailbox('inbox');
      }
    });
  });
}


async function unarchive_email(id) {
  await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  load_mailbox('inbox');
}

async function archive_email(id) {
  await fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  load_mailbox('inbox');

}

function load_email(contents, mailbox) {
  let email = document.createElement('div');
  email.className = 'email-read';
  email.innerHTML = `From: ${contents.sender}<br>
  To: ${contents.recipients}<br>
  Subject: ${contents.subject}<br>
  ${contents.timestamp}<br><br>
  ${contents.body.replace(/\n/g, '<br>')}`;
  document.querySelector('#emails-view').append(email);
  if (contents.read == false) {
    fetch(`/emails/${contents.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  }
  if (mailbox == 'inbox') {
    let button = document.createElement('button');
    button.innerHTML = 'Archive';
    button.onclick = function() {
      archive_email(contents.id);
    };
    document.querySelector('#emails-view').append(button);
    let reply = document.createElement('button');
    reply.innerHTML = 'Reply';
    reply.onclick = function() {
      replyto(contents);
    };
    document.querySelector('#emails-view').append(reply);
  }
  if (mailbox == 'archive') {
    let button = document.createElement('button');
    button.innerHTML = 'UnArchive';
    button.onclick = function() {
      unarchive_email(contents.id);
    };
    document.querySelector('#emails-view').append(button);
    let reply = document.createElement('button');
    reply.innerHTML = 'Reply';
    reply.onclick = function() {
      replyto(contents);
    };
    document.querySelector('#emails-view').append(reply);
  }

}

function open_email(id, mailbox) {
  document.querySelector('#emails-view').innerHTML = '';
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    load_email(email, mailbox);
  })
}

function load_emails(contents, mailbox) {
  let email = document.createElement('div');
  if (contents.read == false) {
    email.className = 'email-unread';
  } else {
    email.className = 'email-read';
  }
  email.id = `email-${contents.id}`;
  email.innerHTML = `From: ${contents.sender}<br>${contents.subject}&emsp;&emsp;${contents.timestamp}`;
  email.onclick = function() {
    open_email(contents.id, mailbox);
  };
  document.querySelector('#emails-view').append(email);
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  // Get mailbox contents
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      load_emails(email, mailbox)
    });
  })
}

