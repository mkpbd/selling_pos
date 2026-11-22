import { CircleAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'

interface FormAlertProps {
  messages: string[]
  title?: string
}

/** Form-level error summary for server messages that don't map to a field. */
export function FormAlert({ messages, title = 'Please fix the following' }: FormAlertProps) {
  return (
    <AnimatePresence initial={false}>
      {messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>{messages.length === 1 ? messages[0] : title}</AlertTitle>
            {messages.length > 1 && (
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {messages.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </AlertDescription>
            )}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
