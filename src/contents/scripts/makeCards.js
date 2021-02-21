const { ipcRenderer, remote } = require('electron');
const _ = require('lodash');

const div = document.getElementById('cards');

const appDirectory = remote.app.getAppPath();

const buildCard = (mapData) => {
  const {
    name,
    author,
    id,
    image = `${appDirectory}/assets/imageNotFound.png`,
    description = null,
  } = mapData;
    const isMapInFavorites = ipcRenderer.sendSync('checkIfLiked', name);
    const likedClass = 'liked';
    const escapedName = name.replace(/'/g, "\\\'");

    const title = (name.length > 43) ? `${name.substring(0, 39).trimEnd()}...` : name;
    const descriptionBlock = description
      ? `data-toggle="tooltip" data-placement="right" data-delay='{"show":"800"}' title="${description}"`
      : '';
    const heartHTML =
    `<a id="heart-${id}" class="btn btn-heart ${isMapInFavorites? likedClass: ''}" onclick="toggleFavorite(${id}, '${escapedName}')">
      <i class="fa${isMapInFavorites? 's': 'r'} fa-heart fa-lg"></i>
    </a>`;

    return `
    <div class="col-*-*">
        <div class="card text-center" ${descriptionBlock} id="card-${id}">
          <div class="card-overlay">
            <img src="../assets/ball.gif" class="loading-gif">
          </div>
          <img src="${image}" class="card-img-top">
          <div class="card-body">
            <h6 class="card-title">${title}</h6>
            <p class="card-author" data-author="${author}">By: ${author}</p>
            <div class="btn-bottom-cont">
              <a class="btn btn-primary button-load" id="load-btn-${id}" onclick="loadMap(${id})">Load</a>
              ${heartHTML}
            </div>
        </div>
      </div>
    </div>
    `;
};

const buildHTML = (maps) => {
  const divs = _.map(maps, buildCard);
  return divs.join(' ');
};

function displaySet (cardsHTML) {
  div.innerHTML = cardsHTML;
  $('[data-toggle="tooltip"]').tooltip();
}

function makeCards () {
  return ipcRenderer.invoke('updateMapsFromDirectory')
    .then((maps) => buildHTML(maps))
    .then(displaySet);
}

function filter () {
  const searchTerm = document.getElementById('searchBar').value.toUpperCase();
  const cards = document.getElementsByClassName('card');
  _.map(cards, (card) => {
    const [{ innerText: title }] = card.getElementsByTagName('h6');
    const titleUpper = title.toUpperCase();
    const author = card.getElementsByClassName('card-author')[0].getAttribute('data-author').toUpperCase();
    if (!titleUpper.includes(searchTerm) && !author.includes(searchTerm)) {
      card.style.display = 'none';
    } else {
      card.style.display = 'flex';
    }
    return null;
  });
}

function clearSearch () {
  const input = document.getElementById('searchBar');
  const cards = document.getElementsByClassName('card');
  input.value = '';
  _.map(cards, (card) => card.style.display = 'flex');
}

ipcRenderer.invoke('updateMapsFromDirectory')
  .then((maps) => buildHTML(maps))
  .then(displaySet)
  .catch((err) => ipcRenderer.send('flashError', err));

ipcRenderer.on('updateCards', () => makeCards()
  .catch((err) => ipcRenderer.send('flashError', err)));
