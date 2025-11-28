
const API_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function buscarLibros(query: string, startIndex = 0, maxResults = 10) {
  const res = await fetch(`${API_URL}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`);
  const data = await res.json();
  return data.items || [];
}

export async function buscarLibroPorID(id: string) {
  const res = await fetch(`${API_URL}/${id}`);
  return await res.json();
}
