'use strict';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = String(Date.now()).slice(-10);

  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates; // [lat, long]
    this.distance = distance; //Km
    this.duration = duration; //Minutes
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration);
    this.cadence = cadence;
    this.calculatePace();
  }

  calculatePace() {
    this.pace = this.duration / this.distance; // min/km
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coordinates, distance, duration, elevation) {
    super(coordinates, distance, duration);
    this.elevation = elevation;
    this.calculateSpeed();
  }
  calculateSpeed() {
    this.speed = this.distance / (this.duration / 60); //km/h
    return this.speed;
  }
}

// APLICATION ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your position!`);
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coordinates = [latitude, longitude];

    this.#map = L.map('map').setView(coordinates, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(event) {
    this.#mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    event.preventDefault();

    // Get data from inputs
    const { lat: clickedLatitude, lng: clickedLongitude } =
      this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    let workout;

    // If workout is running, create a new running object
    if (type === 'running') {
      const cadence = Number(inputCadence.value);
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running(
        [clickedLatitude, clickedLongitude],
        distance,
        duration,
        cadence
      );
    }

    // If workout is cycling, create a new cycling object
    if (type === 'cycling') {
      const elevation = Number(inputElevation.value);
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Cycling(
        [clickedLatitude, clickedLongitude],
        distance,
        duration,
        elevation
      );
    }
    this.#workouts.push(workout);
    console.log(workout);

    // Render workout on map as a marker
    this.renderWorkoutMarker(workout);

    // Render workout on list

    // Hide form and clear inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  renderWorkoutMarker(workout) {
    L.marker([...workout.coordinates])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(String(workout.distance))
      .openPopup();
  }
}

const app = new App();
