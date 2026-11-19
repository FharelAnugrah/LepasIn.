/**
 * Menahan tombol Enter pada elemen <input> agar form multi-kolom / modal
 * tidak tersubmit secara tidak sengaja sebelum pengguna menekan tombol Simpan.
 * Tetap mengizinkan Enter di <textarea> untuk baris baru dan di <button type="submit">.
 *
 * @param {KeyboardEvent | import('react').KeyboardEvent<HTMLFormElement>} e
 */
export function preventEnterSubmitOnInput(e) {
  if (e.key === 'Enter' && e.target?.tagName === 'INPUT') {
    e.preventDefault();
  }
}
