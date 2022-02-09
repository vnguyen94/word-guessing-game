import { BaseModal } from './BaseModal'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

export const AboutModal = ({ isOpen, handleClose }: Props) => {
  return (
    <BaseModal title="About" isOpen={isOpen} handleClose={handleClose}>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        This is{' '}
        <a 
          href="https://github.com/cwackerfuss/react-wordle"
          className="underline font-bold"
        >
          a fork of a word guessing game
        </a>{' '}
        we all know and love, using Firebase to store user scores and leaderboards.{' '}
        <a
          href="https://github.com/vnguyen94/vandle"
          className="underline font-bold"
        >
          Check out the code here!
        </a>{' '}
      </p>
    </BaseModal>
  )
}
