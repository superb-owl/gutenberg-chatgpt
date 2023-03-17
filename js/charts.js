const books = [];
d3.csv('/important-books.csv', function(book) {
  books.push(book);
}).then(_ => renderPage());

function renderPage() {
  $('select').html(`
    ${books.map(book => `
    <option value="${book.id}">${book.title}</option>
    `)}
  `);
  const startBookID = window.location.hash.replace('#', '') || "1513"
  console.log('start', startBookID);
  $('select').val(startBookID);
  pickBook();
}

function renderBook(book) {
  $('#BookTitle').text(`${book.title} by ${book.author}`);
  $("#Sentiment").html("");
  let idx = 0;
  for (let person in book.people_sentiment) {
    renderPersonSentiment(book.ID, person, book.people_sentiment[person]);
  }
}

function renderPersonSentiment(bookID, name, sentiment) {
  const nameID = name.replaceAll(/\W+/g, "_")
  const imageURL = `/output/${bookID}/${nameID}.png`;
  console.log(nameID, imageURL);
  const divStyle = `background: linear-gradient( to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7) ), url(${imageURL}); background-size: cover`
  $("#Sentiment").append(`
    <div class="character" id="${nameID}" style="${divStyle}"></div>
  `);
  console.log('append sentiment');
  $("#" + nameID).append(`
    <h3>${name}</h3>
  `);
  let chart = LineChart(sentiment, {
    title: `Sentiment for ${name}`,
    x: (d, idx) => idx,
    y: d => d.sentiment - 5,
    yDomain: [-4, 4],
    width: 600,
    height: 500,
  });
  $("#" + nameID).append(chart);
}

function pickBook(bookID) {
  bookID = bookID || $('select').val();
  window.location.hash = bookID;
  d3.json(`/output/${bookID}/data.json`).then(bookDetails => {
    bookDetails.ID = bookID;
    renderBook(bookDetails);
  });
}
