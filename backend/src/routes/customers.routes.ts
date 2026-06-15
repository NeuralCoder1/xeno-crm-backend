import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { OrderController } from "../controllers/order.controller";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerSchema
} from "../validators/customer.validator";
import { customerOrderHistoryParamSchema } from "../validators/order.validator";

const router = Router();
const customerController = new CustomerController();
const orderController = new OrderController();

router.get("/", auth, validate({ query: listCustomersQuerySchema }), asyncHandler(customerController.getCustomers));
router.get(
  "/:id/orders",
  auth,
  validate({ params: customerOrderHistoryParamSchema }),
  asyncHandler(orderController.getCustomerOrders)
);
router.get("/:id", auth, validate({ params: customerIdParamSchema }), asyncHandler(customerController.getCustomerById));
router.post("/", auth, validate({ body: createCustomerSchema }), asyncHandler(customerController.createCustomer));
router.put(
  "/:id",
  auth,
  validate({ params: customerIdParamSchema, body: updateCustomerSchema }),
  asyncHandler(customerController.updateCustomer)
);
router.delete("/:id", auth, validate({ params: customerIdParamSchema }), asyncHandler(customerController.deleteCustomer));

export default router;
