const vetModal = document.getElementById('vetBig')
console.log(vetModal)

if (vetModal) {
    console.log('if statement reached')
  vetModal.addEventListener('shown.bs.modal', event => {
    console.log('modal opened')
    const button = event.relatedTarget
    const vetName = button.getAttribute('data-bs-vet-name')
    const vetImage = button.getAttribute('data-bs-vet-image')

    const modalTitle = vetModal.querySelector('.modal-vet-name')
    modalTitle.textContent = vetName

    const modalImage = vetModal.querySelector('.modal-vet-image')
    modalImage.src = vetImage
    
  })
}

