import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderSchema, listOrdersQuerySchema, orderIdParamSchema, updateOrderStatusSchema } from "../validators/order.validator";

const router = Router();
const orderController = new OrderController();

router.post("/", auth, validate({ body: createOrderSchema }), asyncHandler(orderController.createOrder));
router.get("/", auth, validate({ query: listOrdersQuerySchema }), asyncHandler(orderController.getOrders));
router.get("/:id", auth, validate({ params: orderIdParamSchema }), asyncHandler(orderController.getOrderById));
router.patch(
  "/:id/status",
  auth,
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  asyncHandler(orderController.updateOrderStatus)
);

export default router;
