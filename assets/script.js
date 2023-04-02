const UmModal = new bootstrap.Modal('#UmModal')

UmModal.toggle()

function toggleModal() {
    UmModal.toggle()
}

function showMap() {
    document.getElementById('map-s-text').style.display = 'none'
    document.getElementById('map-s').src = 'https://www.google.com/maps/d/u/0/embed?mid=18fWSjSMxdiUAWL821rTGwYyUzcxQ1v0&ehbc=2E312F'
    document.getElementById('map-s-div').style.display = 'block'
}

