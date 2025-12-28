import { useLiveQuery } from 'dexie-react-hooks'
import { nanoid } from 'nanoid'
import { db } from '../db'

/**
 * Custom hook for managing the current dog
 *
 * v1: Single dog only. Returns the first dog in the database.
 * Future: Will support multi-dog with dog selector.
 *
 * @returns Current dog data and operations
 */
export function useDog() {
  // Query first dog (v1: single dog only)
  const dog = useLiveQuery(async () => {
    return db.dogs.toCollection().first()
  }, [])

  // Loading state: useLiveQuery returns undefined while loading
  const isLoading = dog === undefined

  /**
   * Create a new dog (used on first run)
   * @param name - The dog's name
   * @returns The generated dog ID
   */
  const createDog = async (name: string): Promise<string> => {
    const id = nanoid()
    await db.dogs.add({ id, name })
    return id
  }

  /**
   * Update the dog's name
   * @param id - Dog ID
   * @param name - New name
   */
  const updateDog = async (id: string, name: string): Promise<void> => {
    await db.dogs.update(id, { name })
  }

  return {
    dog: dog || null,
    isLoading,
    createDog,
    updateDog,
  }
}
