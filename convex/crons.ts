import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.daily('Refresh homepage trade recommendations', { hourUTC: 7 }, internal.homepageTrades.refresh)
// The same job researches and reviews buys and trades from one FPL snapshot.

export default crons
