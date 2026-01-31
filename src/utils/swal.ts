import Swal from 'sweetalert2';

// Create a configured instance of SweetAlert2
// Applies a very high z-index to ensure it appears above other modals (like PrimeReact)
const CustomSwal = Swal.mixin({
    customClass: {
        container: 'z-[99999]'
    }
});

export default CustomSwal;
